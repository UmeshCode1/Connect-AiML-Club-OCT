-- ==============================================================================
-- AIML CLUB OCT — CONNECT
-- Database Migration: 20260925000007_chronicle_journey_feedback.sql
-- Chronicle, Journey & Feedback Modules Schema
--
-- Complies with:
-- - 03_DATABASE_SCHEMA.md (§20 Feedback, §23 Journey, §28 Chronicle, §29 Event Chronicle)
-- - 04_RBAC_PERMISSIONS.md (§4 Content Manager, Chronicle.*, Journey.*, Feedback.*)
-- - 05_API_SPECIFICATION.md (§16 Feedback, §17 Chronicle, §18 Journey)
-- - 11_SECURITY_PRIVACY.md (§4 Data Minimization, §6 Anonymous Attribution)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. CHRONICLE MODULE
-- ------------------------------------------------------------------------------

-- Master Chronicle Publications / Editorial Editions
CREATE TABLE IF NOT EXISTS chronicle_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  edition_type TEXT NOT NULL DEFAULT 'WEEKLY_UPDATE', -- WEEKLY_UPDATE, MONTHLY_DIGEST, EVENT_RECAP, RESEARCH_DIGEST, ANNUAL_REPORT, SPECIAL_EDITION
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_media_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
  visibility TEXT NOT NULL DEFAULT 'PUBLIC', -- PUBLIC, AUTHENTICATED, TEAM_ONLY, HIDDEN
  status TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT, REVIEW, SCHEDULED, PUBLISHED, ARCHIVED
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Canonical Event References in Chronicle Editions (Without data duplication)
CREATE TABLE IF NOT EXISTS event_chronicle_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chronicle_id UUID NOT NULL REFERENCES chronicle_entries(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_chronicle_event UNIQUE (chronicle_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_chronicle_slug ON chronicle_entries(slug);
CREATE INDEX IF NOT EXISTS idx_chronicle_status_pub ON chronicle_entries(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_chronicle_entry ON event_chronicle_items(chronicle_id);
CREATE INDEX IF NOT EXISTS idx_event_chronicle_event ON event_chronicle_items(event_id);

ALTER TABLE chronicle_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_chronicle_items ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------------------------
-- 2. JOURNEY MODULE
-- ------------------------------------------------------------------------------

-- Historical Milestones of Institutional Legacy
CREATE TABLE IF NOT EXISTS journey_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  milestone_date DATE NOT NULL,
  milestone_type TEXT NOT NULL DEFAULT 'EVENT', -- FOUNDATION, EVENT, ACHIEVEMENT, PARTNERSHIP, LEADERSHIP, RESEARCH, PROJECT, COMMUNITY
  description TEXT,
  cover_media_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
  linked_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  linked_project_id UUID,
  external_link TEXT,
  visibility TEXT NOT NULL DEFAULT 'PUBLIC', -- PUBLIC, AUTHENTICATED, HIDDEN
  status TEXT NOT NULL DEFAULT 'PUBLISHED', -- DRAFT, PUBLISHED, ARCHIVED
  display_order INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journey_slug ON journey_milestones(slug);
CREATE INDEX IF NOT EXISTS idx_journey_date ON journey_milestones(milestone_date DESC, display_order ASC);
CREATE INDEX IF NOT EXISTS idx_journey_status_vis ON journey_milestones(status, visibility);
CREATE INDEX IF NOT EXISTS idx_journey_linked_event ON journey_milestones(linked_event_id);

ALTER TABLE journey_milestones ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------------------------
-- 3. FEEDBACK MODULE
-- ------------------------------------------------------------------------------

-- Canonical Post-Event Attendee Feedback
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE RESTRICT,
  participation_id UUID REFERENCES event_participations(id) ON DELETE SET NULL,
  source TEXT DEFAULT 'PORTAL', -- PORTAL, TALLY, GOOGLE_SHEETS, MANUAL
  source_record_id TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT NOT NULL,
  suggestion_text TEXT,
  publication_consent TEXT NOT NULL DEFAULT 'NO', -- NO, ANONYMOUS, PUBLIC_NAME
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  moderation_status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, FLAGGED
  visibility TEXT NOT NULL DEFAULT 'ADMIN_ONLY', -- ADMIN_ONLY, PUBLIC
  moderated_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,
  moderation_notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_event_student_feedback UNIQUE (event_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_event_mod ON feedback(event_id, moderation_status);
CREATE INDEX IF NOT EXISTS idx_feedback_student ON feedback(student_id);
CREATE INDEX IF NOT EXISTS idx_feedback_visibility ON feedback(visibility);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------------------------
-- 4. ROW-LEVEL SECURITY POLICIES
-- ------------------------------------------------------------------------------

-- 4a. Chronicle RLS Policies
-- Public can view published editions
DROP POLICY IF EXISTS "Public can view published chronicle entries" ON chronicle_entries;
CREATE POLICY "Public can view published chronicle entries"
  ON chronicle_entries FOR SELECT
  USING (visibility = 'PUBLIC' AND status = 'PUBLISHED' AND (scheduled_at IS NULL OR scheduled_at <= NOW()));

-- Staff full access to chronicle (Super Admin, Club Admin, Content Manager)
DROP POLICY IF EXISTS "Staff full access to chronicle" ON chronicle_entries;
CREATE POLICY "Staff full access to chronicle"
  ON chronicle_entries FOR ALL
  TO authenticated
  USING (
    public.check_user_has_role('SUPER_ADMIN', 'CLUB_ADMIN', 'CONTENT_MANAGER')
  );

-- Event chronicle items viewable if parent chronicle is published
DROP POLICY IF EXISTS "Public can view published event chronicle items" ON event_chronicle_items;
CREATE POLICY "Public can view published event chronicle items"
  ON event_chronicle_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chronicle_entries c
      WHERE c.id = event_chronicle_items.chronicle_id
        AND c.visibility = 'PUBLIC'
        AND c.status = 'PUBLISHED'
    )
  );

-- Staff manage event chronicle items
DROP POLICY IF EXISTS "Staff can manage event chronicle items" ON event_chronicle_items;
CREATE POLICY "Staff can manage event chronicle items"
  ON event_chronicle_items FOR ALL
  TO authenticated
  USING (
    public.check_user_has_role('SUPER_ADMIN', 'CLUB_ADMIN', 'CONTENT_MANAGER')
  );


-- 4b. Journey RLS Policies
-- Public can view published journey milestones
DROP POLICY IF EXISTS "Public can view published journey milestones" ON journey_milestones;
CREATE POLICY "Public can view published journey milestones"
  ON journey_milestones FOR SELECT
  USING (visibility = 'PUBLIC' AND status = 'PUBLISHED');

-- Staff full access to journey (Super Admin, Club Admin, Content Manager)
DROP POLICY IF EXISTS "Staff full access to journey" ON journey_milestones;
CREATE POLICY "Staff full access to journey"
  ON journey_milestones FOR ALL
  TO authenticated
  USING (
    public.check_user_has_role('SUPER_ADMIN', 'CLUB_ADMIN', 'CONTENT_MANAGER')
  );


-- 4c. Feedback RLS Policies
-- Public can view approved public feedback (strictly respects publication consent)
DROP POLICY IF EXISTS "Public can view approved public feedback" ON feedback;
CREATE POLICY "Public can view approved public feedback"
  ON feedback FOR SELECT
  USING (
    visibility = 'PUBLIC' 
    AND moderation_status = 'APPROVED'
    AND publication_consent IN ('ANONYMOUS', 'PUBLIC_NAME')
  );

-- Students can view their own submitted feedback
DROP POLICY IF EXISTS "Students can view own feedback" ON feedback;
CREATE POLICY "Students can view own feedback"
  ON feedback FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT sp.id FROM student_profiles sp
      JOIN accounts a ON (a.email = sp.email OR a.id = sp.id)
      WHERE a.auth_user_id = auth.uid()
    )
  );

-- Students can submit feedback for events they attended or participated in
DROP POLICY IF EXISTS "Eligible students can submit feedback" ON feedback;
CREATE POLICY "Eligible students can submit feedback"
  ON feedback FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id IN (
      SELECT sp.id FROM student_profiles sp
      JOIN accounts a ON (a.email = sp.email OR a.id = sp.id)
      WHERE a.auth_user_id = auth.uid()
    )
  );

-- Staff manage feedback moderation (Super Admin, Club Admin, Event Manager, Content Manager)
DROP POLICY IF EXISTS "Staff full access to feedback" ON feedback;
CREATE POLICY "Staff full access to feedback"
  ON feedback FOR ALL
  TO authenticated
  USING (
    public.check_user_has_role('SUPER_ADMIN', 'CLUB_ADMIN', 'EVENT_MANAGER', 'CONTENT_MANAGER')
  );
