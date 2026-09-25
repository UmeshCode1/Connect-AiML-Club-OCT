-- AIML CLUB OCT — CONNECT
-- Migration: 20260925000003_attendance_operations.sql
-- Description: Event sessions, multi-session attendance records, volunteer assignments, constraints, and RLS policies

-- 1. EVENT SESSIONS TABLE
CREATE TABLE IF NOT EXISTS event_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  session_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  venue TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  capacity INTEGER,
  status TEXT NOT NULL DEFAULT 'SCHEDULED', -- SCHEDULED, LIVE, COMPLETED, CANCELLED
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT sessions_date_check CHECK (start_at <= end_at),
  CONSTRAINT sessions_capacity_check CHECK (capacity IS NULL OR capacity >= 0),
  UNIQUE (event_id, session_code)
);

-- 2. ENHANCE ATTENDANCE RECORDS FOR MULTI-SESSION
ALTER TABLE attendance_records 
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES event_sessions(id) ON DELETE CASCADE;

ALTER TABLE attendance_records 
  ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES accounts(id);

-- Enforce single active attendance record per student per session
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_session_student_attendance 
  ON attendance_records (session_id, student_id) 
  WHERE session_id IS NOT NULL;

-- 3. ENHANCE VOLUNTEER ASSIGNMENTS FOR SESSION-SCOPED ROLES
ALTER TABLE volunteer_assignments
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES event_sessions(id) ON DELETE SET NULL;

-- 4. PERFORMANCE & OPERATIONAL INDEXES
CREATE INDEX IF NOT EXISTS idx_sessions_event ON event_sessions (event_id, start_at);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance_records (session_id, status);
CREATE INDEX IF NOT EXISTS idx_volunteer_event_role ON volunteer_assignments (event_id, role);

-- 5. ROW-LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on event_sessions
ALTER TABLE event_sessions ENABLE ROW LEVEL SECURITY;

-- Public can view sessions of published events
DROP POLICY IF EXISTS "Public can view sessions of published events" ON event_sessions;
CREATE POLICY "Public can view sessions of published events"
  ON event_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events e 
      WHERE e.id = event_sessions.event_id 
        AND e.visibility = 'PUBLIC' 
        AND e.status NOT IN ('DRAFT', 'ARCHIVED')
    )
  );

-- Staff manage sessions
DROP POLICY IF EXISTS "Staff can manage event sessions" ON event_sessions;
CREATE POLICY "Staff can manage event sessions"
  ON event_sessions FOR ALL
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

-- Attendance: Student self-view only
DROP POLICY IF EXISTS "Students can view own attendance" ON attendance_records;
CREATE POLICY "Students can view own attendance"
  ON attendance_records FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT sp.id FROM student_profiles sp
      JOIN accounts a ON a.id = sp.id
      WHERE a.auth_user_id = auth.uid()
    )
  );

-- Attendance: Staff full access
DROP POLICY IF EXISTS "Staff full access to attendance" ON attendance_records;
CREATE POLICY "Staff full access to attendance"
  ON attendance_records FOR ALL
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

-- Attendance: Volunteers assigned to ATTENDANCE role can mark check-in/out
DROP POLICY IF EXISTS "Volunteers can mark attendance for assigned event" ON attendance_records;
CREATE POLICY "Volunteers can mark attendance for assigned event"
  ON attendance_records FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM volunteer_assignments va
      JOIN student_profiles sp ON sp.id = va.student_id
      JOIN accounts a ON a.id = sp.id
      WHERE a.auth_user_id = auth.uid()
        AND va.event_id = attendance_records.event_id
        AND va.role = 'ATTENDANCE'
        AND va.status = 'ASSIGNED'
    )
  );

-- Volunteers: Management by Staff
DROP POLICY IF EXISTS "Staff can manage volunteer assignments" ON volunteer_assignments;
CREATE POLICY "Staff can manage volunteer assignments"
  ON volunteer_assignments FOR ALL
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

-- Volunteers: Volunteer can view own assignment
DROP POLICY IF EXISTS "Volunteers can view own assignments" ON volunteer_assignments;
CREATE POLICY "Volunteers can view own assignments"
  ON volunteer_assignments FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT sp.id FROM student_profiles sp
      JOIN accounts a ON a.id = sp.id
      WHERE a.auth_user_id = auth.uid()
    )
  );
