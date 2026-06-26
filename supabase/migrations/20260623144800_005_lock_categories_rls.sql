-- Drop unsafe policies on categories
DROP POLICY IF EXISTS "categories_authenticated_insert" ON categories;
DROP POLICY IF EXISTS "categories_authenticated_update" ON categories;
DROP POLICY IF EXISTS "categories_authenticated_delete" ON categories;

-- The "categories_public_read" policy remains active, allowing users to SELECT
-- Only Super Admins (via Supabase Dashboard / Service Role) should manage categories from now on.
