-- Fix function_search_path_mutable warnings
-- We set search_path = public for functions that rely on public tables
ALTER FUNCTION public.create_new_tenant(text) SET search_path = public;
ALTER FUNCTION public.get_user_tenant_id() SET search_path = public;
ALTER FUNCTION public.is_tenant_admin(uuid) SET search_path = public;
ALTER FUNCTION public.update_updated_at() SET search_path = public;

-- Safety wrapper for rls_auto_enable (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rls_auto_enable') THEN
    ALTER FUNCTION public.rls_auto_enable() SET search_path = public;
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
  END IF;
END $$;

-- Fix anon_security_definer_function_executable & authenticated_security_definer_function_executable warnings
-- Revoke execution of trigger function from everyone (only the DB system runs triggers)
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;

-- Revoke execution from anonymous users for sensitive RPCs
REVOKE EXECUTE ON FUNCTION public.create_new_tenant(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_tenant_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_tenant_admin(uuid) FROM PUBLIC, anon;

-- Explicitly ensure authenticated users can execute the RPCs they need
GRANT EXECUTE ON FUNCTION public.create_new_tenant(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_tenant_admin(uuid) TO authenticated;

-- Fix pg_graphql_anon_table_exposed & pg_graphql_authenticated_table_exposed
-- Since this is a REST API app, we safely exclude these tables from the GraphQL schema
COMMENT ON TABLE public.categories IS '@graphql({"exclude": true})';
COMMENT ON TABLE public.guides IS '@graphql({"exclude": true})';
COMMENT ON TABLE public.step_media IS '@graphql({"exclude": true})';
COMMENT ON TABLE public.steps IS '@graphql({"exclude": true})';
COMMENT ON TABLE public.tenant_users IS '@graphql({"exclude": true})';
COMMENT ON TABLE public.tenants IS '@graphql({"exclude": true})';
COMMENT ON TABLE public.user_progress IS '@graphql({"exclude": true})';
