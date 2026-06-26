-- ============================================================
-- Migration 009: Auth Triggers for Automatic Tenant Creation
-- ============================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  new_tenant_id UUID;
  company_name TEXT;
BEGIN
  -- Extract company name from metadata
  company_name := NEW.raw_user_meta_data->>'company_name';
  
  -- If company name is provided, create a tenant and link it
  IF company_name IS NOT NULL AND company_name != '' THEN
    INSERT INTO public.tenants (name) 
    VALUES (company_name) 
    RETURNING id INTO new_tenant_id;
    
    INSERT INTO public.tenant_users (tenant_id, user_id, role)
    VALUES (new_tenant_id, NEW.id, 'admin');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function after a user is inserted
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
