-- Move the AI quota SECURITY DEFINER call behind the authenticated Edge Function.
DROP FUNCTION IF EXISTS public.consume_ultron_ai_quota();

CREATE OR REPLACE FUNCTION public.consume_ultron_ai_quota(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_plan text := 'free';
  v_limit integer := 30;
  v_window_seconds constant integer := 3600;
  v_allowed boolean;
BEGIN
  IF p_user_id IS NULL THEN RETURN false; END IF;

  SELECT e.plan INTO v_plan
  FROM public.ultron_entitlements AS e
  WHERE e.user_id = p_user_id
    AND e.status = 'active'
    AND (e.expires_at IS NULL OR e.expires_at > now())
  LIMIT 1;

  v_limit := CASE v_plan
    WHEN 'plus' THEN 100
    WHEN 'pro' THEN 300
    ELSE 30
  END;

  INSERT INTO public.ultron_ai_usage AS current_usage
    (user_id, window_started_at, request_count)
  VALUES (p_user_id, now(), 1)
  ON CONFLICT (user_id) DO UPDATE
  SET
    window_started_at = CASE
      WHEN current_usage.window_started_at <= now() - make_interval(secs => v_window_seconds) THEN now()
      ELSE current_usage.window_started_at
    END,
    request_count = CASE
      WHEN current_usage.window_started_at <= now() - make_interval(secs => v_window_seconds) THEN 1
      ELSE current_usage.request_count + 1
    END
  RETURNING request_count <= v_limit INTO v_allowed;

  RETURN coalesce(v_allowed, false);
END;
$$;

REVOKE ALL ON FUNCTION public.consume_ultron_ai_quota(uuid)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ultron_ai_quota(uuid)
TO service_role;
