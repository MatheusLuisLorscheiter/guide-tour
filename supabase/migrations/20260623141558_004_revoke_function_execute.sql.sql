-- Revoke EXECUTE permissions on update_updated_at function from public roles
-- This function should only be called internally by triggers, not via REST API
REVOKE EXECUTE ON FUNCTION update_updated_at() FROM anon;
REVOKE EXECUTE ON FUNCTION update_updated_at() FROM authenticated;