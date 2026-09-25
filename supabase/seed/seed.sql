-- ==============================================================================
-- AIML CLUB OCT — CONNECT
-- Database Seed Data: seed.sql
-- Default Team Roles & Permissions Matrix
-- Sourced from: 04_RBAC_PERMISSIONS.md
-- ==============================================================================

INSERT INTO team_roles (name, description, permissions)
VALUES
  ('SUPER_ADMIN', 'Full platform administration, security, integrations, and recovery privileges.', 
   '["*"]'::jsonb),
   
  ('CLUB_ADMIN', 'Operational club leadership and module management.', 
   '["events.view", "events.create", "events.update", "events.publish", "participants.view", "participants.create", "participants.import", "participants.update", "participants.export", "attendance.view", "attendance.mark", "attendance.correct", "media.view", "media.upload", "media.process", "certificates.view", "certificates.generate", "certificates.issue", "certificates.revoke", "feedback.view", "feedback.publish", "chronicle.*", "journey.*", "projects.*", "research.*", "learning.*", "integrations.view", "integrations.sync", "audit.view"]'::jsonb),
   
  ('EVENT_MANAGER', 'Manages assigned events, participants, attendance, and volunteers.', 
   '["events.view", "events.create", "events.update", "events.publish", "participants.view", "participants.create", "participants.import", "participants.update", "participants.export", "attendance.view", "attendance.mark", "attendance.correct", "media.view", "media.upload", "feedback.view"]'::jsonb),
   
  ('MEDIA_MANAGER', 'Manages event photo/video ingestion and media processing pipelines.', 
   '["events.view", "media.view", "media.upload", "media.process", "media.delete"]'::jsonb),
   
  ('CERTIFICATE_MANAGER', 'Manages certificate templates, batch generation, issuance, and revocation.', 
   '["events.view", "certificates.view", "certificates.generate", "certificates.issue", "certificates.revoke"]'::jsonb),
   
  ('CONTENT_MANAGER', 'Manages public articles, Chronicle, Journey, Projects, and Learning resources.', 
   '["events.view", "events.publish", "feedback.view", "feedback.publish", "chronicle.*", "journey.*", "projects.*", "research.*", "learning.*"]'::jsonb),
   
  ('VOLUNTEER', 'Event-scoped operational support including check-in scanning and assigned tasks.', 
   '["events.view", "attendance.view", "attendance.mark", "media.view", "media.upload"]'::jsonb),
   
  ('VIEWER', 'Read-only access to authorized resources.', 
   '["events.view", "media.view"]'::jsonb)
ON CONFLICT (name) DO UPDATE 
SET permissions = EXCLUDED.permissions,
    description = EXCLUDED.description;
