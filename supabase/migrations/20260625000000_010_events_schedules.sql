-- ============================================================
-- Migration 010: Events, Schedules, and Tenant Settings
-- ============================================================

-- 1. Tenant Settings
CREATE TABLE tenant_settings (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  target_city TEXT, -- Used for Firecrawl search
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_settings_read" ON tenant_settings FOR SELECT
  TO authenticated USING (tenant_id = get_user_tenant_id());
CREATE POLICY "tenant_settings_update" ON tenant_settings FOR UPDATE
  TO authenticated USING (is_tenant_admin(tenant_id)) WITH CHECK (is_tenant_admin(tenant_id));
CREATE POLICY "tenant_settings_insert" ON tenant_settings FOR INSERT
  TO authenticated WITH CHECK (is_tenant_admin(tenant_id));

-- Trigger for updated_at
CREATE TRIGGER update_tenant_settings_updated_at
  BEFORE UPDATE ON tenant_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. Events (populated by Firecrawl/Gemini or manual)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT get_user_tenant_id(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  estimated_impact TEXT, -- e.g., 'High', 'Medium', 'Low', '10000 pessoas'
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_read" ON events FOR SELECT
  TO authenticated USING (tenant_id = get_user_tenant_id());
CREATE POLICY "events_insert" ON events FOR INSERT
  TO authenticated WITH CHECK (is_tenant_admin(tenant_id));
CREATE POLICY "events_update" ON events FOR UPDATE
  TO authenticated USING (is_tenant_admin(tenant_id)) WITH CHECK (is_tenant_admin(tenant_id));
CREATE POLICY "events_delete" ON events FOR DELETE
  TO authenticated USING (is_tenant_admin(tenant_id));

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. Schedules (Turnos / Escalas de trabalho)
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE DEFAULT get_user_tenant_id(),
  title TEXT NOT NULL, -- e.g., 'Turno da Noite', 'Festa do Morango - Stand 1'
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL, -- Optional link to an event
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schedules_read" ON schedules FOR SELECT
  TO authenticated USING (tenant_id = get_user_tenant_id());
CREATE POLICY "schedules_insert" ON schedules FOR INSERT
  TO authenticated WITH CHECK (is_tenant_admin(tenant_id));
CREATE POLICY "schedules_update" ON schedules FOR UPDATE
  TO authenticated USING (is_tenant_admin(tenant_id)) WITH CHECK (is_tenant_admin(tenant_id));
CREATE POLICY "schedules_delete" ON schedules FOR DELETE
  TO authenticated USING (is_tenant_admin(tenant_id));

CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4. Schedule Assignments (Quem vai trabalhar no turno)
CREATE TABLE schedule_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(schedule_id, user_id)
);
ALTER TABLE schedule_assignments ENABLE ROW LEVEL SECURITY;

-- users can read assignments in their tenant (via schedule's tenant_id)
CREATE POLICY "assignments_read" ON schedule_assignments FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM schedules 
      WHERE schedules.id = schedule_assignments.schedule_id 
      AND schedules.tenant_id = get_user_tenant_id()
    )
  );

-- Only admins can insert
CREATE POLICY "assignments_insert" ON schedule_assignments FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM schedules 
      WHERE schedules.id = schedule_assignments.schedule_id 
      AND is_tenant_admin(schedules.tenant_id)
    )
  );

-- Only admins can delete
CREATE POLICY "assignments_delete" ON schedule_assignments FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM schedules 
      WHERE schedules.id = schedule_assignments.schedule_id 
      AND is_tenant_admin(schedules.tenant_id)
    )
  );

-- Users can update their own status, admins can update anything in their tenant
CREATE POLICY "assignments_update" ON schedule_assignments FOR UPDATE
  TO authenticated USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM schedules 
      WHERE schedules.id = schedule_assignments.schedule_id 
      AND is_tenant_admin(schedules.tenant_id)
    )
  ) WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM schedules 
      WHERE schedules.id = schedule_assignments.schedule_id 
      AND is_tenant_admin(schedules.tenant_id)
    )
  );

CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON schedule_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
