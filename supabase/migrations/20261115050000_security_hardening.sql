-- ULTRON security hardening and owner-management index support.
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.ultron_manage_owner(
  p_target_user_id uuid,
  p_actor_user_id uuid,
  p_action text,
  p_target_email_hint text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_owner_count integer;
  v_rows integer;
BEGIN
  IF p_action NOT IN ('add', 'remove') THEN
    RAISE EXCEPTION 'Unsupported owner action';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(726401921::bigint);

  IF p_action = 'add' THEN
    INSERT INTO public.ultron_user_roles (user_id, role)
    VALUES (p_target_user_id, 'owner')
    ON CONFLICT (user_id) DO NOTHING;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN RETURN 'already_owner'; END IF;
    INSERT INTO public.ultron_owner_audit (actor_id, action, plan, target_email_hint)
    VALUES (p_actor_user_id, 'owner_added', 'free', p_target_email_hint);
    RETURN 'added';
  END IF;

  SELECT count(*) INTO v_owner_count
  FROM public.ultron_user_roles WHERE role = 'owner';
  IF NOT EXISTS (
    SELECT 1 FROM public.ultron_user_roles
    WHERE user_id = p_target_user_id AND role = 'owner'
  ) THEN RETURN 'not_owner'; END IF;
  IF v_owner_count <= 1 THEN RETURN 'last_owner'; END IF;

  DELETE FROM public.ultron_user_roles
  WHERE user_id = p_target_user_id AND role = 'owner';
  INSERT INTO public.ultron_owner_audit (actor_id, action, plan, target_email_hint)
  VALUES (p_actor_user_id, 'owner_removed', 'free', p_target_email_hint);
  RETURN 'removed';
END;
$$;

REVOKE ALL ON FUNCTION public.ultron_manage_owner(uuid, uuid, text, text)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ultron_manage_owner(uuid, uuid, text, text)
TO service_role;

CREATE INDEX IF NOT EXISTS ultron_entitlements_granted_by_idx
  ON public.ultron_entitlements (granted_by);
CREATE INDEX IF NOT EXISTS ultron_owner_audit_actor_id_idx
  ON public.ultron_owner_audit (actor_id);
