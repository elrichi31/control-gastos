-- Apply after 20261001_mcp_oauth.sql, before deploying automatic ChatGPT OAuth.
-- Shared assertion replay protection across all Vercel workers. No expense tables change.
BEGIN;
CREATE TABLE public.mcp_oauth_assertions (
  client_id text NOT NULL,
  jti_hash text NOT NULL CHECK (jti_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (client_id, jti_hash)
);
CREATE INDEX ON public.mcp_oauth_assertions(expires_at);
ALTER TABLE public.mcp_oauth_assertions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mcp_oauth_assertions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.mcp_oauth_assertions TO service_role;

CREATE FUNCTION public.mcp_consume_assertion(p_client_id text, p_jti_hash text, p_expires_at timestamptz)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE inserted integer;
BEGIN
  IF p_client_id <> 'https://chatgpt.com/oauth/client.json'
     OR p_jti_hash !~ '^[a-f0-9]{64}$'
     OR p_expires_at <= now()
     OR p_expires_at > now() + interval '10 minutes'
     OR p_client_id IS NULL OR p_jti_hash IS NULL OR p_expires_at IS NULL THEN
    RETURN false;
  END IF;
  -- Bound cleanup work; never evict an unexpired replay marker.
  DELETE FROM public.mcp_oauth_assertions
    WHERE (client_id,jti_hash) IN (
      SELECT client_id,jti_hash FROM public.mcp_oauth_assertions
      WHERE expires_at <= now() ORDER BY expires_at LIMIT 500
    );
  INSERT INTO public.mcp_oauth_assertions(client_id,jti_hash,expires_at)
    VALUES(p_client_id,p_jti_hash,p_expires_at)
    ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS inserted = ROW_COUNT;
  RETURN inserted = 1;
END;
$$;
REVOKE ALL ON FUNCTION public.mcp_consume_assertion(text,text,timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mcp_consume_assertion(text,text,timestamptz) TO service_role;
COMMIT;
