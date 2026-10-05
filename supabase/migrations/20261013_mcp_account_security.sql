-- Apply in Supabase SQL Editor after 20261001_mcp_oauth.sql.
-- Idempotent. Does not change scopes, token rotation or expiry.
BEGIN;
CREATE OR REPLACE FUNCTION public.mcp_account_active(p_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE id=p_user_id AND (banned_until IS NULL OR banned_until<=now()));
$$;
REVOKE ALL ON FUNCTION public.mcp_account_active(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mcp_account_active(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.mcp_revoke_on_account_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.encrypted_password IS DISTINCT FROM OLD.encrypted_password
     OR NEW.banned_until IS DISTINCT FROM OLD.banned_until THEN
    UPDATE public.mcp_oauth_grants SET revoked_at=now() WHERE user_id=NEW.id AND revoked_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.mcp_revoke_on_account_change() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS mcp_revoke_on_account_change ON auth.users;
CREATE TRIGGER mcp_revoke_on_account_change AFTER UPDATE OF encrypted_password, banned_until ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.mcp_revoke_on_account_change();

-- Immediately disable legacy grants belonging to accounts already blocked.
UPDATE public.mcp_oauth_grants g SET revoked_at=now() FROM auth.users u
WHERE g.user_id=u.id AND g.revoked_at IS NULL AND u.banned_until>now();

CREATE OR REPLACE FUNCTION public.mcp_create_authorization(p_user_id uuid, p_client_id text, p_resource text, p_redirect_uri text, p_challenge text, p_code_hash text, p_scopes text[])
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE gid uuid;
BEGIN
  -- Serialize issuance with account changes so a concurrent ban cannot leave a new live grant.
  PERFORM 1 FROM auth.users WHERE id=p_user_id AND (banned_until IS NULL OR banned_until<=now()) FOR SHARE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  INSERT INTO public.mcp_oauth_grants(user_id,client_id,resource,scopes) VALUES (p_user_id,p_client_id,p_resource,p_scopes) RETURNING id INTO gid;
  INSERT INTO public.mcp_oauth_codes(code_hash,grant_id,redirect_uri,challenge) VALUES (p_code_hash,gid,p_redirect_uri,p_challenge);
  RETURN gid;
END;
$$;

CREATE OR REPLACE FUNCTION public.mcp_exchange_code(p_code_hash text, p_client_id text, p_redirect_uri text, p_resource text, p_challenge text, p_access_hash text, p_refresh_hash text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE c public.mcp_oauth_codes; g public.mcp_oauth_grants;
BEGIN
  SELECT * INTO c FROM public.mcp_oauth_codes WHERE code_hash=p_code_hash FOR UPDATE;
  IF NOT FOUND OR c.expires_at <= now() OR c.redirect_uri<>p_redirect_uri OR c.challenge<>p_challenge THEN RETURN NULL; END IF;
  SELECT * INTO g FROM public.mcp_oauth_grants WHERE id=c.grant_id FOR UPDATE;
  IF NOT FOUND OR g.revoked_at IS NOT NULL OR g.expires_at<=now() OR g.client_id<>p_client_id OR g.resource<>p_resource THEN RETURN NULL; END IF;
  IF NOT public.mcp_account_active(g.user_id) THEN RETURN NULL; END IF;
  DELETE FROM public.mcp_oauth_codes WHERE code_hash=p_code_hash;
  INSERT INTO public.mcp_oauth_tokens(token_hash,grant_id,kind,expires_at) VALUES
    (p_access_hash,g.id,'access',LEAST(now()+interval '15 minutes',g.expires_at)),
    (p_refresh_hash,g.id,'refresh',g.expires_at);
  RETURN jsonb_build_object('user_id',g.user_id,'scopes',g.scopes,'expires_in',floor(extract(epoch FROM LEAST(now()+interval '15 minutes',g.expires_at)-now()))::integer);
END;
$$;

CREATE OR REPLACE FUNCTION public.mcp_refresh_tokens(p_refresh_hash text, p_client_id text, p_resource text, p_access_hash text, p_next_refresh_hash text, p_scopes text[] DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE t public.mcp_oauth_tokens; g public.mcp_oauth_grants;
BEGIN
  SELECT * INTO t FROM public.mcp_oauth_tokens WHERE token_hash=p_refresh_hash AND kind='refresh' FOR UPDATE;
  IF NOT FOUND OR t.expires_at<=now() THEN RETURN NULL; END IF;
  SELECT * INTO g FROM public.mcp_oauth_grants WHERE id=t.grant_id FOR UPDATE;
  IF NOT FOUND OR g.revoked_at IS NOT NULL OR g.expires_at<=now() OR g.client_id<>p_client_id OR g.resource<>p_resource THEN RETURN NULL; END IF;
  IF NOT public.mcp_account_active(g.user_id) THEN RETURN NULL; END IF;
  -- Retain reused hashes to detect replay across serverless workers.
  IF t.consumed_at IS NOT NULL THEN
    UPDATE public.mcp_oauth_grants SET revoked_at=now() WHERE id=g.id;
    RETURN NULL;
  END IF;
  IF p_scopes IS NOT NULL THEN
    IF cardinality(p_scopes)=0 OR NOT p_scopes <@ g.scopes THEN RETURN NULL; END IF;
    UPDATE public.mcp_oauth_grants SET scopes=p_scopes WHERE id=g.id;
    g.scopes := p_scopes;
  END IF;
  UPDATE public.mcp_oauth_tokens SET consumed_at=now() WHERE token_hash=p_refresh_hash;
  INSERT INTO public.mcp_oauth_tokens(token_hash,grant_id,kind,expires_at) VALUES
    (p_access_hash,g.id,'access',LEAST(now()+interval '15 minutes',g.expires_at)),
    (p_next_refresh_hash,g.id,'refresh',g.expires_at);
  RETURN jsonb_build_object('user_id',g.user_id,'scopes',g.scopes,'expires_in',floor(extract(epoch FROM LEAST(now()+interval '15 minutes',g.expires_at)-now()))::integer);
END;
$$;

CREATE OR REPLACE FUNCTION public.mcp_verify_access(p_token_hash text, p_client_id text, p_resource text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE g public.mcp_oauth_grants;
BEGIN
  SELECT grants.* INTO g FROM public.mcp_oauth_grants grants JOIN public.mcp_oauth_tokens tokens ON tokens.grant_id=grants.id
    WHERE tokens.token_hash=p_token_hash AND tokens.kind='access' AND tokens.expires_at>now()
      AND grants.client_id=p_client_id AND grants.resource=p_resource AND grants.revoked_at IS NULL AND grants.expires_at>now()
    FOR UPDATE OF grants;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF NOT public.mcp_account_active(g.user_id) THEN RETURN NULL; END IF;
  IF g.window_start <= now()-interval '1 minute' THEN
    UPDATE public.mcp_oauth_grants SET window_start=now(), request_count=1 WHERE id=g.id;
  ELSIF g.request_count>=120 THEN
    RETURN jsonb_build_object('rate_limited',true);
  ELSE
    UPDATE public.mcp_oauth_grants SET request_count=request_count+1 WHERE id=g.id;
  END IF;
  RETURN jsonb_build_object('user_id',g.user_id,'scopes',g.scopes,'grant_id',g.id);
END;
$$;

-- Reassert ACLs; CREATE OR REPLACE preserves the existing RPC signatures.
REVOKE ALL ON FUNCTION public.mcp_create_authorization(uuid,text,text,text,text,text,text[]), public.mcp_exchange_code(text,text,text,text,text,text,text), public.mcp_refresh_tokens(text,text,text,text,text,text[]), public.mcp_verify_access(text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mcp_create_authorization(uuid,text,text,text,text,text,text[]), public.mcp_exchange_code(text,text,text,text,text,text,text), public.mcp_refresh_tokens(text,text,text,text,text,text[]), public.mcp_verify_access(text,text,text) TO service_role;
COMMIT;
