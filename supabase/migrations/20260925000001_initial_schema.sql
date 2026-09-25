-- ==============================================================================
-- AIML CLUB OCT — CONNECT
-- Database Migration: 20260925000001_initial_schema.sql
-- Foundation Schema & Security Architecture
--
-- Complies with:
-- - 03_DATABASE_SCHEMA.md
-- - 04_RBAC_PERMISSIONS.md
-- - 11_SECURITY_PRIVACY.md
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
-- Note: 'vector' extension is created if available in the Supabase/PostgreSQL instance
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS "vector";
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pgvector extension not installed in environment, skipping vector extension';
END $$;

-- 2. ACCOUNTS (Authentication to Application Mapping)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE NOT NULL,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. STUDENT PROFILES (Stable Canonical Person Record)
CREATE TABLE IF NOT EXISTS student_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_code TEXT UNIQUE, -- e.g. STU-000184
  enrollment_number TEXT UNIQUE NOT NULL, -- e.g. 0126AL221001
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  department TEXT,
  course TEXT,
  batch TEXT,
  semester TEXT,
  avatar_media_id UUID,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TEAM ROLES & MEMBERSHIPS (Club Operational Organization)
CREATE TABLE IF NOT EXISTS team_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE RESTRICT,
  role_id UUID REFERENCES team_roles(id) ON DELETE SET NULL,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. EVENTS (Canonical Operational Aggregate)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_code TEXT UNIQUE NOT NULL, -- e.g. EVT-APTIFY-2026
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  short_description TEXT,
  description TEXT,
  event_type TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  visibility TEXT NOT NULL DEFAULT 'PUBLIC',
  cover_media_id UUID,
  venue TEXT,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  registration_open_at TIMESTAMPTZ,
  registration_close_at TIMESTAMPTZ,
  capacity INTEGER,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. EVENT PARTICIPATIONS (Relationship between Student and Event)
CREATE TABLE IF NOT EXISTS event_participations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE RESTRICT,
  registration_source TEXT, -- TALLY, GOOGLE_SHEETS, MANUAL, CSV, WALK_IN
  source_record_id TEXT,
  registration_status TEXT NOT NULL DEFAULT 'REGISTERED',
  event_role TEXT,
  team_name TEXT,
  result TEXT,
  notes TEXT,
  registered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, student_id)
);

-- 7. ATTENDANCE RECORDS (Event Attendance Log)
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE RESTRICT,
  participation_id UUID REFERENCES event_participations(id) ON DELETE CASCADE,
  check_in_at TIMESTAMPTZ,
  check_out_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'PRESENT',
  source TEXT, -- QR, MANUAL, KIOSK
  corrected_by UUID REFERENCES accounts(id),
  correction_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. GOOGLE DRIVE FOLDERS MAPPING (Storage Architecture)
CREATE TABLE IF NOT EXISTS drive_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  folder_type TEXT NOT NULL, -- EVENT_ROOT, PHOTOS, VIDEOS, CERTIFICATES, DOCUMENTS, RESOURCES
  google_drive_folder_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. MEDIA ASSETS (Metadata for Google Drive Files)
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  media_type TEXT NOT NULL, -- PHOTO, VIDEO, DOCUMENT, POSTER, CERTIFICATE
  title TEXT,
  original_filename TEXT,
  mime_type TEXT,
  file_size BIGINT,
  checksum TEXT,
  google_drive_file_id TEXT UNIQUE,
  google_drive_folder_id TEXT,
  visibility TEXT NOT NULL DEFAULT 'EVENT_MEMBERS',
  processing_status TEXT NOT NULL DEFAULT 'UPLOADED',
  width INTEGER,
  height INTEGER,
  duration_seconds NUMERIC,
  uploaded_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. CERTIFICATE TEMPLATES & CERTIFICATES
CREATE TABLE IF NOT EXISTS certificate_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  certificate_type TEXT NOT NULL,
  google_drive_file_id TEXT,
  configuration JSONB NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  certificate_id TEXT UNIQUE NOT NULL, -- e.g. AIML26-APT-000184
  verification_token_hash TEXT UNIQUE NOT NULL,
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE RESTRICT,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  certificate_type TEXT NOT NULL,
  template_id UUID REFERENCES certificate_templates(id),
  google_drive_file_id TEXT,
  status TEXT NOT NULL DEFAULT 'GENERATED',
  issued_at TIMESTAMPTZ,
  issued_by UUID REFERENCES accounts(id),
  replaced_by UUID REFERENCES certificates(id),
  revoked_at TIMESTAMPTZ,
  revoke_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. AUDIT LOGS (Append-only security & administrative event journal)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_account_id UUID REFERENCES accounts(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  before_data JSONB,
  after_data JSONB,
  metadata JSONB,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. INDEXES
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_student_enrollment ON student_profiles(enrollment_number);
CREATE INDEX IF NOT EXISTS idx_student_email ON student_profiles(email);
CREATE INDEX IF NOT EXISTS idx_participations_event ON event_participations(event_id);
CREATE INDEX IF NOT EXISTS idx_participations_student ON event_participations(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_event ON attendance_records(event_id);
CREATE INDEX IF NOT EXISTS idx_certificates_cert_id ON certificates(certificate_id);
CREATE INDEX IF NOT EXISTS idx_media_drive_file ON media_assets(google_drive_file_id);

-- 13. ROW LEVEL SECURITY (RLS) ACTIVATION
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 14. INITIAL RLS POLICIES (Foundation)
-- Public can view published public events
CREATE POLICY "Public events are viewable by everyone" ON events
  FOR SELECT USING (visibility = 'PUBLIC' AND status NOT IN ('DRAFT', 'PLANNING'));

-- Public can verify genuine certificates without authentication
CREATE POLICY "Certificates public verification view" ON certificates
  FOR SELECT USING (status = 'VALID');
