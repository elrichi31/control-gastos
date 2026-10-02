-- Private registry for sessions issued by BethaSpend (web and mobile).
-- Apply before setting AUTH_SESSION_REGISTRY_ENABLED=true. Existing users are unchanged.
CREATE TABLE IF NOT EXISTS public.app_auth_sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  CONSTRAINT app_auth_session_expiry CHECK (expires_at > created_at AND expires_at <= created_at + interval '30 days')
);
CREATE INDEX IF NOT EXISTS app_auth_sessions_user_active ON public.app_auth_sessions(user_id) WHERE revoked_at IS NULL;
ALTER TABLE public.app_auth_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_auth_sessions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_auth_sessions TO service_role;

-- Lock the account while issuing a session: concurrent bans then either deny issuance
-- or wait for issuance and revoke the committed row through the auth-change trigger.
CREATE OR REPLACE FUNCTION public.assert_app_session_account_active()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE account_banned_until timestamptz;
BEGIN
  SELECT banned_until INTO account_banned_until FROM auth.users WHERE id = NEW.user_id FOR SHARE;
  IF NOT FOUND OR account_banned_until > now() THEN
    RAISE EXCEPTION 'Account unavailable' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.assert_app_session_account_active() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS app_session_requires_active_account ON public.app_auth_sessions;
CREATE TRIGGER app_session_requires_active_account BEFORE INSERT ON public.app_auth_sessions
  FOR EACH ROW EXECUTE FUNCTION public.assert_app_session_account_active();

-- Auth changes invalidate already-issued app JWTs, not only Supabase refresh tokens.
CREATE OR REPLACE FUNCTION public.revoke_app_sessions_on_auth_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.encrypted_password IS DISTINCT FROM OLD.encrypted_password
     OR NEW.banned_until IS DISTINCT FROM OLD.banned_until THEN
    UPDATE public.app_auth_sessions SET revoked_at = now()
      WHERE user_id = NEW.id AND revoked_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.revoke_app_sessions_on_auth_change() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS app_auth_change_revokes_sessions ON auth.users;
CREATE TRIGGER app_auth_change_revokes_sessions AFTER UPDATE OF encrypted_password, banned_until ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.revoke_app_sessions_on_auth_change();
