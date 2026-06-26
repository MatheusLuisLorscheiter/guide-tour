-- 1. Create Tenants Table
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  primary_color TEXT DEFAULT '#f97316', -- orange-500
  secondary_color TEXT DEFAULT '#dc2626', -- red-600
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Tenant Users (Roles)
CREATE TABLE tenant_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- 3. Add tenant_id to existing tables
ALTER TABLE categories ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE guides ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- 4. Data Migration: Create a default tenant for existing data
DO $$
DECLARE
  default_tenant_id UUID;
  existing_user_id UUID;
BEGIN
  -- Check if we have users, if so, create a default tenant
  SELECT id INTO existing_user_id FROM auth.users LIMIT 1;
  
  IF existing_user_id IS NOT NULL THEN
    INSERT INTO tenants (name) VALUES ('Minha Empresa') RETURNING id INTO default_tenant_id;
    
    -- Assign all existing users to this tenant as admins
    INSERT INTO tenant_users (tenant_id, user_id, role)
    SELECT default_tenant_id, id, 'admin' FROM auth.users;
    
    -- Assign existing records to this tenant
    UPDATE categories SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
    UPDATE guides SET tenant_id = default_tenant_id WHERE tenant_id IS NULL;
  END IF;
END $$;

-- 5. Helper Function to get user's tenant
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
DECLARE
  tid UUID;
BEGIN
  SELECT tenant_id INTO tid FROM tenant_users WHERE user_id = auth.uid() LIMIT 1;
  RETURN tid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make tenant_id NOT NULL and set DEFAULT for future records
ALTER TABLE categories ALTER COLUMN tenant_id SET DEFAULT get_user_tenant_id();
ALTER TABLE categories ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE guides ALTER COLUMN tenant_id SET DEFAULT get_user_tenant_id();
ALTER TABLE guides ALTER COLUMN tenant_id SET NOT NULL;

CREATE OR REPLACE FUNCTION is_tenant_admin(tid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tenant_users 
    WHERE user_id = auth.uid() AND tenant_id = tid AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Enable RLS on new tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

-- 7. Update RLS Policies

-- Tenants
CREATE POLICY "tenants_read" ON tenants FOR SELECT
  TO authenticated USING (id = get_user_tenant_id());
CREATE POLICY "tenants_update" ON tenants FOR UPDATE
  TO authenticated USING (is_tenant_admin(id)) WITH CHECK (is_tenant_admin(id));

-- Tenant Users
CREATE POLICY "tenant_users_read" ON tenant_users FOR SELECT
  TO authenticated USING (tenant_id = get_user_tenant_id());
CREATE POLICY "tenant_users_insert" ON tenant_users FOR INSERT
  TO authenticated WITH CHECK (is_tenant_admin(tenant_id));
CREATE POLICY "tenant_users_update" ON tenant_users FOR UPDATE
  TO authenticated USING (is_tenant_admin(tenant_id)) WITH CHECK (is_tenant_admin(tenant_id));
CREATE POLICY "tenant_users_delete" ON tenant_users FOR DELETE
  TO authenticated USING (is_tenant_admin(tenant_id));

-- Categories
DROP POLICY IF EXISTS "categories_public_read" ON categories;
CREATE POLICY "categories_tenant_read" ON categories FOR SELECT
  TO authenticated USING (tenant_id = get_user_tenant_id());
CREATE POLICY "categories_tenant_insert" ON categories FOR INSERT
  TO authenticated WITH CHECK (is_tenant_admin(tenant_id));
CREATE POLICY "categories_tenant_update" ON categories FOR UPDATE
  TO authenticated USING (is_tenant_admin(tenant_id)) WITH CHECK (is_tenant_admin(tenant_id));
CREATE POLICY "categories_tenant_delete" ON categories FOR DELETE
  TO authenticated USING (is_tenant_admin(tenant_id));

-- Guides
DROP POLICY IF EXISTS "guides_public_read" ON guides;
DROP POLICY IF EXISTS "guides_authenticated_read_all" ON guides;
DROP POLICY IF EXISTS "guides_authenticated_insert" ON guides;
DROP POLICY IF EXISTS "guides_authenticated_update" ON guides;
DROP POLICY IF EXISTS "guides_authenticated_delete" ON guides;

CREATE POLICY "guides_tenant_read" ON guides FOR SELECT
  TO authenticated USING (tenant_id = get_user_tenant_id() AND (is_active = true OR is_tenant_admin(tenant_id)));
CREATE POLICY "guides_tenant_insert" ON guides FOR INSERT
  TO authenticated WITH CHECK (is_tenant_admin(tenant_id));
CREATE POLICY "guides_tenant_update" ON guides FOR UPDATE
  TO authenticated USING (is_tenant_admin(tenant_id)) WITH CHECK (is_tenant_admin(tenant_id));
CREATE POLICY "guides_tenant_delete" ON guides FOR DELETE
  TO authenticated USING (is_tenant_admin(tenant_id));

-- Steps (Fix isolation so it relies on guides properly)
DROP POLICY IF EXISTS "steps_read" ON steps;
CREATE POLICY "steps_tenant_read" ON steps FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM guides 
      WHERE guides.id = steps.guide_id 
      AND guides.tenant_id = get_user_tenant_id()
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 8. RPC for Tenant Creation
-- This allows a new user to create their own tenant and become an admin
CREATE OR REPLACE FUNCTION create_new_tenant(new_name TEXT)
RETURNS UUID AS $$
DECLARE
  new_tenant_id UUID;
BEGIN
  -- Insert the new tenant
  INSERT INTO tenants (name) VALUES (new_name) RETURNING id INTO new_tenant_id;
  
  -- Link the current user as admin
  INSERT INTO tenant_users (tenant_id, user_id, role)
  VALUES (new_tenant_id, auth.uid(), 'admin');
  
  RETURN new_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
