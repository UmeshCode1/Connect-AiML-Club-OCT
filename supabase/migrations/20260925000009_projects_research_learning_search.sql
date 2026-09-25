-- ==============================================================================
-- AIML CLUB OCT — CONNECT
-- Database Migration: 20260925000009_projects_research_learning_search.sql
-- Knowledge & Innovation Showcase Schema (Projects, Research, Learning, Search)
--
-- Complies with:
-- - 03_DATABASE_SCHEMA.md (§24 Projects, §25 Project Members, §26 Research, §27 Learning)
-- - 04_RBAC_PERMISSIONS.md (§4 Content Manager, Projects.*, Research.*, Learning.*)
-- - 05_API_SPECIFICATION.md (§19 Projects, §20 Research, §21 Learning, §22 Search)
-- - 11_SECURITY_PRIVACY.md (§4 URL Scheme Validation, Granular RBAC)
-- ==============================================================================

-- Ensure pg_trgm extension is active for trigram text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";


-- ------------------------------------------------------------------------------
-- 1. PROJECTS MODULE
-- ------------------------------------------------------------------------------

-- Master Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'IN_DEVELOPMENT', -- IDEA, IN_DEVELOPMENT, COMPLETED, ARCHIVED
  technology_stack TEXT[] NOT NULL DEFAULT '{}',
  repository_url TEXT,
  demo_url TEXT,
  documentation_url TEXT,
  cover_media_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
  linked_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  visibility TEXT NOT NULL DEFAULT 'PUBLIC', -- PUBLIC, AUTHENTICATED, TEAM_ONLY, HIDDEN
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_project_status CHECK (status IN ('IDEA', 'IN_DEVELOPMENT', 'COMPLETED', 'ARCHIVED')),
  CONSTRAINT check_project_visibility CHECK (visibility IN ('PUBLIC', 'AUTHENTICATED', 'TEAM_ONLY', 'HIDDEN')),
  CONSTRAINT check_project_repo_url CHECK (repository_url IS NULL OR repository_url ~* '^https?://'),
  CONSTRAINT check_project_demo_url CHECK (demo_url IS NULL OR demo_url ~* '^https?://'),
  CONSTRAINT check_project_doc_url CHECK (documentation_url IS NULL OR documentation_url ~* '^https?://')
);

-- Project Members Junction Table (Attribution linking student profiles to projects)
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE RESTRICT,
  role TEXT NOT NULL DEFAULT 'CONTRIBUTOR', -- LEAD, CONTRIBUTOR, MENTOR, ADVISOR
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_project_member_role CHECK (role IN ('LEAD', 'CONTRIBUTOR', 'MENTOR', 'ADVISOR')),
  CONSTRAINT uq_project_student UNIQUE (project_id, student_id)
);

-- Operational and search indexes for projects
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_status_vis ON projects(status, visibility);
CREATE INDEX IF NOT EXISTS idx_projects_linked_event ON projects(linked_event_id);
CREATE INDEX IF NOT EXISTS idx_projects_cover_media ON projects(cover_media_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_trgm ON projects USING gin (title gin_trgm_ops, summary gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_project_members_proj ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_student ON project_members(student_id);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------------------------
-- 2. RESEARCH MODULE
-- ------------------------------------------------------------------------------

-- Master Research Items Table (Academic papers, pre-prints, datasets)
CREATE TABLE IF NOT EXISTS research_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  abstract TEXT NOT NULL,
  authors JSONB NOT NULL DEFAULT '[]', -- [{ name, enrollment_number, affiliation, role }]
  category TEXT NOT NULL DEFAULT 'AI_ML', -- AI_ML, COMPUTER_VISION, NLP, REINFORCEMENT_LEARNING, GENERATIVE_AI, ROBOTICS, DATA_SCIENCE
  methodology TEXT,
  publication_url TEXT,
  repository_url TEXT,
  dataset_url TEXT,
  linked_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  linked_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  visibility TEXT NOT NULL DEFAULT 'PUBLIC', -- PUBLIC, AUTHENTICATED, HIDDEN
  status TEXT NOT NULL DEFAULT 'PUBLISHED', -- DRAFT, PUBLISHED, ARCHIVED
  created_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_research_category CHECK (category IN ('AI_ML', 'COMPUTER_VISION', 'NLP', 'REINFORCEMENT_LEARNING', 'GENERATIVE_AI', 'ROBOTICS', 'DATA_SCIENCE')),
  CONSTRAINT check_research_visibility CHECK (visibility IN ('PUBLIC', 'AUTHENTICATED', 'HIDDEN')),
  CONSTRAINT check_research_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  CONSTRAINT check_research_pub_url CHECK (publication_url IS NULL OR publication_url ~* '^https?://'),
  CONSTRAINT check_research_repo_url CHECK (repository_url IS NULL OR repository_url ~* '^https?://'),
  CONSTRAINT check_research_dataset_url CHECK (dataset_url IS NULL OR dataset_url ~* '^https?://')
);

CREATE INDEX IF NOT EXISTS idx_research_slug ON research_items(slug);
CREATE INDEX IF NOT EXISTS idx_research_status_vis ON research_items(status, visibility);
CREATE INDEX IF NOT EXISTS idx_research_category ON research_items(category);
CREATE INDEX IF NOT EXISTS idx_research_linked_event ON research_items(linked_event_id);
CREATE INDEX IF NOT EXISTS idx_research_linked_project ON research_items(linked_project_id);
CREATE INDEX IF NOT EXISTS idx_research_created_by ON research_items(created_by);
CREATE INDEX IF NOT EXISTS idx_research_trgm ON research_items USING gin (title gin_trgm_ops, abstract gin_trgm_ops);

ALTER TABLE research_items ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------------------------
-- 3. LEARNING RESOURCES MODULE
-- ------------------------------------------------------------------------------

-- Master Learning Resources Table (Notebooks, slides, recordings, tutorials)
CREATE TABLE IF NOT EXISTS learning_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  resource_type TEXT NOT NULL DEFAULT 'TUTORIAL', -- NOTEBOOK, TUTORIAL, WORKSHOP_MATERIAL, RECORDING, DATASET, SLIDES, DOCUMENTATION
  difficulty_level TEXT NOT NULL DEFAULT 'BEGINNER', -- BEGINNER, INTERMEDIATE, ADVANCED
  description TEXT,
  url TEXT NOT NULL,
  cover_media_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
  linked_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  visibility TEXT NOT NULL DEFAULT 'PUBLIC', -- PUBLIC, AUTHENTICATED, HIDDEN
  created_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_learning_resource_type CHECK (resource_type IN ('NOTEBOOK', 'TUTORIAL', 'WORKSHOP_MATERIAL', 'RECORDING', 'DATASET', 'SLIDES', 'DOCUMENTATION')),
  CONSTRAINT check_learning_difficulty_level CHECK (difficulty_level IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
  CONSTRAINT check_learning_visibility CHECK (visibility IN ('PUBLIC', 'AUTHENTICATED', 'HIDDEN')),
  CONSTRAINT check_learning_url CHECK (url ~* '^https?://')
);

CREATE INDEX IF NOT EXISTS idx_learning_slug ON learning_resources(slug);
CREATE INDEX IF NOT EXISTS idx_learning_type_vis ON learning_resources(resource_type, visibility);
CREATE INDEX IF NOT EXISTS idx_learning_diff ON learning_resources(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_learning_event ON learning_resources(linked_event_id);
CREATE INDEX IF NOT EXISTS idx_learning_cover_media ON learning_resources(cover_media_id);
CREATE INDEX IF NOT EXISTS idx_learning_created_by ON learning_resources(created_by);
CREATE INDEX IF NOT EXISTS idx_learning_trgm ON learning_resources USING gin (title gin_trgm_ops);

ALTER TABLE learning_resources ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------------------------
-- 4. ROW-LEVEL SECURITY POLICIES
-- ------------------------------------------------------------------------------

-- 4a. Projects Policies
DROP POLICY IF EXISTS "Public can view published projects" ON projects;
CREATE POLICY "Public can view published projects"
  ON projects FOR SELECT
  USING (
    visibility = 'PUBLIC'
    AND status IN ('IN_DEVELOPMENT', 'COMPLETED')
    AND (published_at IS NULL OR published_at <= NOW())
  );

DROP POLICY IF EXISTS "Contributors can view own non-public projects" ON projects;
CREATE POLICY "Contributors can view own non-public projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN student_profiles sp ON sp.id = pm.student_id
      JOIN accounts a ON (a.email = sp.email OR a.id = sp.id)
      WHERE pm.project_id = projects.id
        AND a.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Project leads can update own projects" ON projects;
CREATE POLICY "Project leads can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN student_profiles sp ON sp.id = pm.student_id
      JOIN accounts a ON (a.email = sp.email OR a.id = sp.id)
      WHERE pm.project_id = projects.id
        AND pm.role = 'LEAD'
        AND a.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN student_profiles sp ON sp.id = pm.student_id
      JOIN accounts a ON (a.email = sp.email OR a.id = sp.id)
      WHERE pm.project_id = projects.id
        AND pm.role = 'LEAD'
        AND a.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Staff full access to projects" ON projects;
CREATE POLICY "Staff full access to projects"
  ON projects FOR ALL
  TO authenticated
  USING (
    public.check_user_has_role('SUPER_ADMIN', 'CLUB_ADMIN', 'CONTENT_MANAGER')
  );


-- 4b. Project Members Policies
DROP POLICY IF EXISTS "Public can view project members of visible projects" ON project_members;
CREATE POLICY "Public can view project members of visible projects"
  ON project_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_members.project_id
        AND p.visibility = 'PUBLIC'
        AND p.status IN ('IN_DEVELOPMENT', 'COMPLETED')
        AND (p.published_at IS NULL OR p.published_at <= NOW())
    )
  );

DROP POLICY IF EXISTS "Contributors can view members of own projects" ON project_members;
CREATE POLICY "Contributors can view members of own projects"
  ON project_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN student_profiles sp ON sp.id = pm.student_id
      JOIN accounts a ON (a.email = sp.email OR a.id = sp.id)
      WHERE pm.project_id = project_members.project_id
        AND a.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Project leads can manage project members" ON project_members;
CREATE POLICY "Project leads can manage project members"
  ON project_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN student_profiles sp ON sp.id = pm.student_id
      JOIN accounts a ON (a.email = sp.email OR a.id = sp.id)
      WHERE pm.project_id = project_members.project_id
        AND pm.role = 'LEAD'
        AND a.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Staff can manage project members" ON project_members;
CREATE POLICY "Staff can manage project members"
  ON project_members FOR ALL
  TO authenticated
  USING (
    public.check_user_has_role('SUPER_ADMIN', 'CLUB_ADMIN', 'CONTENT_MANAGER')
  );


-- 4c. Research Items Policies
DROP POLICY IF EXISTS "Public can view published research items" ON research_items;
CREATE POLICY "Public can view published research items"
  ON research_items FOR SELECT
  USING (
    visibility = 'PUBLIC'
    AND status = 'PUBLISHED'
  );

DROP POLICY IF EXISTS "Authors can view own research items" ON research_items;
CREATE POLICY "Authors can view own research items"
  ON research_items FOR SELECT
  TO authenticated
  USING (
    created_by IN (
      SELECT a.id FROM accounts a WHERE a.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authors can update own draft research items" ON research_items;
CREATE POLICY "Authors can update own draft research items"
  ON research_items FOR UPDATE
  TO authenticated
  USING (
    created_by IN (
      SELECT a.id FROM accounts a WHERE a.auth_user_id = auth.uid()
    )
    AND status = 'DRAFT'
  )
  WITH CHECK (
    created_by IN (
      SELECT a.id FROM accounts a WHERE a.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Staff full access to research items" ON research_items;
CREATE POLICY "Staff full access to research items"
  ON research_items FOR ALL
  TO authenticated
  USING (
    public.check_user_has_role('SUPER_ADMIN', 'CLUB_ADMIN', 'CONTENT_MANAGER')
  );


-- 4d. Learning Resources Policies
DROP POLICY IF EXISTS "Public can view published learning resources" ON learning_resources;
CREATE POLICY "Public can view published learning resources"
  ON learning_resources FOR SELECT
  USING (
    visibility = 'PUBLIC'
  );

DROP POLICY IF EXISTS "Staff full access to learning resources" ON learning_resources;
CREATE POLICY "Staff full access to learning resources"
  ON learning_resources FOR ALL
  TO authenticated
  USING (
    public.check_user_has_role('SUPER_ADMIN', 'CLUB_ADMIN', 'CONTENT_MANAGER')
  );
