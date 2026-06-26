-- ============================================================
-- Migration 008: Team Management RPCs
-- ============================================================

-- 1. RPC: Invite a user to the current tenant by email
CREATE OR REPLACE FUNCTION invite_user_to_tenant(user_email TEXT, user_role TEXT DEFAULT 'user')
RETURNS JSON AS $$
DECLARE
  target_user_id UUID;
  current_tenant_id UUID;
  result JSON;
BEGIN
  -- Verify caller is an admin
  current_tenant_id := get_user_tenant_id();
  IF current_tenant_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Você não pertence a nenhum tenant.');
  END IF;

  IF NOT is_tenant_admin(current_tenant_id) THEN
    RETURN json_build_object('success', false, 'message', 'Apenas administradores podem convidar membros.');
  END IF;

  -- Validate role
  IF user_role NOT IN ('admin', 'user') THEN
    RETURN json_build_object('success', false, 'message', 'Role inválida. Use "admin" ou "user".');
  END IF;

  -- Find user by email
  SELECT id INTO target_user_id FROM auth.users WHERE email = user_email;

  IF target_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Nenhum usuário encontrado com este e-mail. O usuário precisa criar uma conta primeiro.');
  END IF;

  -- Check if user is already in the tenant
  IF EXISTS (SELECT 1 FROM public.tenant_users WHERE tenant_id = current_tenant_id AND user_id = target_user_id) THEN
    RETURN json_build_object('success', false, 'message', 'Este usuário já faz parte da equipe.');
  END IF;

  -- Check if user already belongs to another tenant
  IF EXISTS (SELECT 1 FROM public.tenant_users WHERE user_id = target_user_id) THEN
    RETURN json_build_object('success', false, 'message', 'Este usuário já pertence a outro tenant.');
  END IF;

  -- Insert
  INSERT INTO public.tenant_users (tenant_id, user_id, role)
  VALUES (current_tenant_id, target_user_id, user_role);

  RETURN json_build_object('success', true, 'message', 'Membro adicionado com sucesso!');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. RPC: Update a user's role within the tenant
CREATE OR REPLACE FUNCTION update_user_role(target_user_id UUID, new_role TEXT)
RETURNS JSON AS $$
DECLARE
  current_tenant_id UUID;
BEGIN
  current_tenant_id := get_user_tenant_id();

  IF NOT is_tenant_admin(current_tenant_id) THEN
    RETURN json_build_object('success', false, 'message', 'Apenas administradores podem alterar roles.');
  END IF;

  IF new_role NOT IN ('admin', 'user') THEN
    RETURN json_build_object('success', false, 'message', 'Role inválida.');
  END IF;

  -- Prevent changing own role
  IF target_user_id = auth.uid() THEN
    RETURN json_build_object('success', false, 'message', 'Você não pode alterar sua própria role.');
  END IF;

  UPDATE public.tenant_users
  SET role = new_role
  WHERE tenant_id = current_tenant_id AND user_id = target_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Membro não encontrado neste tenant.');
  END IF;

  RETURN json_build_object('success', true, 'message', 'Role atualizada com sucesso!');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. RPC: Remove a user from the tenant
CREATE OR REPLACE FUNCTION remove_user_from_tenant(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  current_tenant_id UUID;
BEGIN
  current_tenant_id := get_user_tenant_id();

  IF NOT is_tenant_admin(current_tenant_id) THEN
    RETURN json_build_object('success', false, 'message', 'Apenas administradores podem remover membros.');
  END IF;

  -- Prevent removing self
  IF target_user_id = auth.uid() THEN
    RETURN json_build_object('success', false, 'message', 'Você não pode remover a si mesmo da equipe.');
  END IF;

  DELETE FROM public.tenant_users
  WHERE tenant_id = current_tenant_id AND user_id = target_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Membro não encontrado neste tenant.');
  END IF;

  RETURN json_build_object('success', true, 'message', 'Membro removido com sucesso!');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Security: Revoke anon access, grant only authenticated
REVOKE EXECUTE ON FUNCTION invite_user_to_tenant(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION invite_user_to_tenant(TEXT, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION update_user_role(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION update_user_role(UUID, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION remove_user_from_tenant(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION remove_user_from_tenant(UUID) TO authenticated;
