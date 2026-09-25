-- ==============================================================================
-- AIML CLUB OCT — CONNECT
-- Database Migration: 20260925000006_database_foundation_reconciliation.sql
-- Database Foundation & RLS Reconciliation Migration
--
-- Resolves:
-- - DEBT-01: Ensures volunteer_assignments table prerequisite exists with all
--            constraints, foreign keys, indexes, and RLS policies.
-- - DEBT-02: Reconciles RLS role references to canonical team_roles / team_memberships
--            RBAC architecture and hardens security definer role check functions.
--
-- Complies with:
-- - 03_DATABASE_SCHEMA.md (§5, §6, §10)
-- - 04_RBAC_PERMISSIONS.md (§1, §2)
-- - 11_SECURITY_PRIVACY.md (§4, §5)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. DEBT-01 RESOLUTION: volunteer_assignments TABLE CREATION
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS volunteer_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  session_id UUID REFERENCES event_sessions(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE RESTRICT,
  role TEXT NOT NULL DEFAULT 'ATTENDANCE',
  status TEXT NOT NULL DEFAULT 'ASSIGNED',
  assigned_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_event_volunteer_session_role UNIQUE (event_id, student_id, session_id, role)
);

-- Operational indexes for volunteer queries and check-in validation
CREATE INDEX IF NOT EXISTS idx_volunteer_event_role ON volunteer_assignments (event_id, role);
CREATE INDEX IF NOT EXISTS idx_volunteer_student ON volunteer_assignments (student_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_session ON volunteer_assignments (session_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_status ON volunteer_assignments (status);

-- Enable RLS
ALTER TABLE volunteer_assignments ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------------------------
-- 2. DEBT-02 RESOLUTION: CANONICAL RBAC SECURITY DEFINER FUNCTIONS
-- ------------------------------------------------------------------------------

-- Helper to evaluate if the authenticated identity has any of the allowed roles
-- based strictly on the canonical team_roles and team_memberships schema.
CREATE OR REPLACE FUNCTION public.check_user_has_role(VARIADIC allowed_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  authorized BOOLEAN;
BEGIN
  -- If unauthenticated, deny immediately
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM accounts a
    JOIN student_profiles sp ON (sp.email = a.email OR sp.id = a.id)
    JOIN team_memberships tm ON tm.student_id = sp.id AND tm.status = 'ACTIVE'
    JOIN team_roles tr ON tr.id = tm.role_id
    WHERE a.auth_user_id = auth.uid()
      AND (
        tr.name = 'SUPER_ADMIN' 
        OR tr.name = ANY(allowed_roles)
      )
  ) INTO authorized;

  RETURN COALESCE(authorized, FALSE);
END;
$$;

-- Revoke public execution and pin execution strictly to authenticated users
REVOKE ALL ON FUNCTION public.check_user_has_role(VARIADIC TEXT[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_user_has_role(VARIADIC TEXT[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.check_user_has_role(VARIADIC TEXT[]) TO authenticated;


-- Helper to evaluate if the authenticated user is an active volunteer for a specific event
CREATE OR REPLACE FUNCTION public.check_user_is_event_volunteer(target_event_id UUID, required_role TEXT DEFAULT 'ATTENDANCE')
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  is_volunteer BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM volunteer_assignments va
    JOIN student_profiles sp ON sp.id = va.student_id
    JOIN accounts a ON (a.email = sp.email OR a.id = sp.id)
    WHERE a.auth_user_id = auth.uid()
      AND va.event_id = target_event_id
      AND (va.role = required_role OR required_role IS NULL)
      AND va.status = 'ASSIGNED'
  ) INTO is_volunteer;

  RETURN COALESCE(is_volunteer, FALSE);
END;
$$;

REVOKE ALL ON FUNCTION public.check_user_is_event_volunteer(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_user_is_event_volunteer(UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.check_user_is_event_volunteer(UUID, TEXT) TO authenticated;


-- ------------------------------------------------------------------------------
-- 3. RLS POLICIES RECONCILIATION & HARDENING
-- ------------------------------------------------------------------------------

-- 3a. events table
DROP POLICY IF EXISTS "Staff full access to events" ON events;
CREATE POLICY "Staff full access to events"
  ON events FOR ALL
  TO authenticated
  USING (
    public.check_user_has_role('SUPER_ADMIN', 'CLUB_ADMIN', 'EVENT_MANAGER')
  );

-- 3b. event_participations table
DROP POLICY IF EXISTS "Staff can manage event participations" ON event_participations;
CREATE POLICY "Staff can manage event participations"
  ON event_participations FOR ALL
  TO authenticated
  USING (
    public.check_user_has_role('SUPER_ADMIN', 'CLUB_ADMIN', 'EVENT_MANAGER')
  );

-- 3c. event_sessions table
DROP POLICY IF EXISTS "Staff can manage event sessions" ON event_sessions;
CREATE POLICY "Staff can manage event sessions"
  ON event_sessions FOR ALL
  TO authenticated
  USING (
    public.check_user_has_role('SUPER_ADMIN', 'CLUB_ADMIN', 'EVENT_MANAGER')
  );

-- 3d. attendance_records table
DROP POLICY IF EXISTS "Staff full access to attendance" ON attendance_records;
CREATE POLICY "Staff full access to attendance"
  ON attendance_records FOR ALL
  TO authenticated
  USING (
    public.check_user_has_role('SUPER_ADMIN', 'CLUB_ADMIN', 'EVENT_MANAGER')
  );

DROP POLICY IF EXISTS "Volunteers can mark attendance for assigned event" ON attendance_records;
CREATE POLICY "Volunteers can mark attendance for assigned event"
  ON attendance_records FOR INSERT
  TO authenticated
  WITH CHECK (
    public.check_user_is_event_volunteer(attendance_records.event_id, 'ATTENDANCE')
    OR public.check_user_has_role('SUPER_ADMIN', 'CLUB_ADMIN', 'EVENT_MANAGER')
  );

-- 3e. volunteer_assignments table
DROP POLICY IF EXISTS "Staff can manage volunteer assignments" ON volunteer_assignments;
CREATE POLICY "Staff can manage volunteer assignments"
  ON volunteer_assignments FOR ALL
  TO authenticated
  USING (
    public.check_user_has_role('SUPER_ADMIN', 'CLUB_ADMIN', 'EVENT_MANAGER')
  );

DROP POLICY IF EXISTS "Volunteers can view own assignments" ON volunteer_assignments;
CREATE POLICY "Volunteers can view own assignments"
  ON volunteer_assignments FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT sp.id FROM student_profiles sp
      JOIN accounts a ON (a.email = sp.email OR a.id = sp.id)
      WHERE a.auth_user_id = auth.uid()
    )
    OR public.check_user_has_role('SUPER_ADMIN', 'CLUB_ADMIN', 'EVENT_MANAGER')
  );

-- 3f. certificate_batches table
DROP POLICY IF EXISTS "Batches viewable by event managers and admins" ON certificate_batches;
CREATE POLICY "Batches viewable by event managers and admins" ON certificate_batches
  FOR ALL
  TO authenticated
  USING (
    public.check_user_has_role('SUPER_ADMIN', 'CLUB_ADMIN', 'EVENT_MANAGER', 'CERTIFICATE_MANAGER')
  );
