-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories for organizing guides
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'folder',
  color TEXT DEFAULT '#3B82F6',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guides (passo a passo)
CREATE TABLE guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  estimated_time INTEGER, -- in minutes
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  is_active BOOLEAN DEFAULT true,
  views_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Steps within a guide
CREATE TABLE steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guide_id UUID REFERENCES guides(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tip TEXT, -- optional tip/warning
  duration_seconds INTEGER, -- optional duration for this step
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Media for steps (images, annotations)
CREATE TABLE step_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  step_id UUID REFERENCES steps(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progress tracking (which steps users completed)
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guide_id UUID REFERENCES guides(id) ON DELETE CASCADE,
  step_id UUID REFERENCES steps(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, guide_id, step_id)
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE step_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Categories: public read, admin write
CREATE POLICY "categories_public_read" ON categories FOR SELECT
  TO public USING (true);
CREATE POLICY "categories_authenticated_insert" ON categories FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "categories_authenticated_update" ON categories FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "categories_authenticated_delete" ON categories FOR DELETE
  TO authenticated USING (true);

-- Guides: public read active, authenticated write own
CREATE POLICY "guides_public_read" ON guides FOR SELECT
  TO public USING (is_active = true);
CREATE POLICY "guides_authenticated_read_all" ON guides FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "guides_authenticated_insert" ON guides FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "guides_authenticated_update" ON guides FOR UPDATE
  TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "guides_authenticated_delete" ON guides FOR DELETE
  TO authenticated USING (auth.uid() = created_by);

-- Steps: follow guide visibility
CREATE POLICY "steps_read" ON steps FOR SELECT
  TO public USING (
    EXISTS (
      SELECT 1 FROM guides 
      WHERE guides.id = steps.guide_id 
      AND (guides.is_active = true OR auth.uid() IS NOT NULL)
    )
  );
CREATE POLICY "steps_authenticated_insert" ON steps FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM guides 
      WHERE guides.id = steps.guide_id 
      AND guides.created_by = auth.uid()
    )
  );
CREATE POLICY "steps_authenticated_update" ON steps FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM guides 
      WHERE guides.id = steps.guide_id 
      AND guides.created_by = auth.uid()
    )
  );
CREATE POLICY "steps_authenticated_delete" ON steps FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM guides 
      WHERE guides.id = steps.guide_id 
      AND guides.created_by = auth.uid()
    )
  );

-- Step media: follow step visibility
CREATE POLICY "step_media_read" ON step_media FOR SELECT
  TO public USING (
    EXISTS (
      SELECT 1 FROM steps 
      JOIN guides ON guides.id = steps.guide_id
      WHERE steps.id = step_media.step_id 
      AND (guides.is_active = true OR auth.uid() IS NOT NULL)
    )
  );
CREATE POLICY "step_media_authenticated_insert" ON step_media FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM steps 
      JOIN guides ON guides.id = steps.guide_id
      WHERE steps.id = step_media.step_id 
      AND guides.created_by = auth.uid()
    )
  );
CREATE POLICY "step_media_authenticated_delete" ON step_media FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM steps 
      JOIN guides ON guides.id = steps.guide_id
      WHERE steps.id = step_media.step_id 
      AND guides.created_by = auth.uid()
    )
  );

-- User progress: users only see/edit own progress
CREATE POLICY "user_progress_own_read" ON user_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_progress_own_insert" ON user_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_progress_own_delete" ON user_progress FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_guides_category ON guides(category_id);
CREATE INDEX idx_guides_created_by ON guides(created_by);
CREATE INDEX idx_steps_guide ON steps(guide_id);
CREATE INDEX idx_step_media_step ON step_media(step_id);
CREATE INDEX idx_user_progress_user_guide ON user_progress(user_id, guide_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for timestamps
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_guides_updated_at
  BEFORE UPDATE ON guides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_steps_updated_at
  BEFORE UPDATE ON steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Insert default categories
INSERT INTO categories (name, description, icon, color, sort_order) VALUES
('Pizzas Tradicionais', 'Guias para preparo de pizzas tradicionais', 'utensils', '#EF4444', 1),
('Cones Salgados', 'Preparo de cones salgados em formato triangular', 'triangle', '#F59E0B', 2),
('Cones Doces', 'Preparo de cones doces e sobremesas', 'cake', '#EC4899', 3),
('Rotina de Limpeza', 'Procedimentos de limpeza e organização', 'sparkles', '#10B981', 4),
('Abertura/Fechamento', 'Procedimentos de abertura e fechamento da loja', 'door-open', '#6366F1', 5),
('Atendimento', 'Guias de atendimento ao cliente', 'users', '#8B5CF6', 6);