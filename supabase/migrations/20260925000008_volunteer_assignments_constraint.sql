-- ==============================================================================
-- AIML CLUB OCT — CONNECT
-- Database Migration: 20260925000008_volunteer_assignments_constraint.sql
-- Volunteer Assignments Composite Unique Constraint Reconciliation
--
-- Complies with:
-- - 03_DATABASE_SCHEMA.md (§10 volunteer_assignments)
-- - 04_RBAC_PERMISSIONS.md (§7 Volunteer Operations)
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'uq_event_volunteer_session_role'
      AND conrelid = 'public.volunteer_assignments'::regclass
  ) THEN
    ALTER TABLE public.volunteer_assignments
      ADD CONSTRAINT uq_event_volunteer_session_role
      UNIQUE (event_id, student_id, session_id, role);
  END IF;
END $$;
