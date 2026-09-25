-- AIML CLUB OCT — CONNECT
-- Migration: 20260925000002_event_engine.sql
-- Description: Indexes, constraints, and Row-Level Security policies for Event Management & Registration Engine

-- 1. CONSTRAINTS ON EVENTS
ALTER TABLE events 
  ADD CONSTRAINT events_date_check 
  CHECK (start_at IS NULL OR end_at IS NULL OR start_at <= end_at);

ALTER TABLE events 
  ADD CONSTRAINT events_registration_date_check 
  CHECK (registration_open_at IS NULL OR registration_close_at IS NULL OR registration_open_at <= registration_close_at);

ALTER TABLE events 
  ADD CONSTRAINT events_capacity_check 
  CHECK (capacity IS NULL OR capacity >= 0);

-- 2. DISCOVERY & SEARCH INDEXES
CREATE INDEX IF NOT EXISTS idx_events_slug ON events (slug);
CREATE INDEX IF NOT EXISTS idx_events_status_visibility ON events (status, visibility, start_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_title_trgm ON events USING gin (title gin_trgm_ops);

-- 3. PARTICIPATION & CAPACITY INDEXES
CREATE INDEX IF NOT EXISTS idx_event_participations_event_status ON event_participations (event_id, registration_status);
CREATE INDEX IF NOT EXISTS idx_event_participations_student ON event_participations (student_id);

-- 4. ROW-LEVEL SECURITY POLICIES FOR EVENTS
-- Public Read: Anyone can read published, non-draft events
DROP POLICY IF EXISTS "Public can view published events" ON events;
CREATE POLICY "Public can view published events"
  ON events FOR SELECT
  USING (visibility = 'PUBLIC' AND status NOT IN ('DRAFT', 'ARCHIVED'));

-- Staff / Admin Management: Super admins, club admins, and event managers have full access
DROP POLICY IF EXISTS "Staff full access to events" ON events;
CREATE POLICY "Staff full access to events"
  ON events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      JOIN accounts a ON a.id = ur.account_id
      WHERE a.auth_user_id = auth.uid()
        AND r.name IN ('SUPER_ADMIN', 'CLUB_ADMIN', 'EVENT_MANAGER')
    )
  );

-- 5. ROW-LEVEL SECURITY POLICIES FOR EVENT PARTICIPATIONS
-- Participant self-access: Students can view their own registration
DROP POLICY IF EXISTS "Students can view own event participations" ON event_participations;
CREATE POLICY "Students can view own event participations"
  ON event_participations FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT sp.id FROM student_profiles sp
      JOIN accounts a ON a.id = sp.id -- or account mapping
      WHERE a.auth_user_id = auth.uid()
    )
  );

-- Staff manage event participations:
DROP POLICY IF EXISTS "Staff can manage event participations" ON event_participations;
CREATE POLICY "Staff can manage event participations"
  ON event_participations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      JOIN accounts a ON a.id = ur.account_id
      WHERE a.auth_user_id = auth.uid()
        AND r.name IN ('SUPER_ADMIN', 'CLUB_ADMIN', 'EVENT_MANAGER')
    )
  );
