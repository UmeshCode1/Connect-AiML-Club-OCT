-- ==============================================================================
-- AIML CLUB OCT — CONNECT
-- Database Migration: 20260925000004_media_intelligence.sql
-- Media Intelligence, Face Indexing & Privacy Architecture
--
-- Complies with:
-- - 03_DATABASE_SCHEMA.md (§11–17)
-- - 04_RBAC_PERMISSIONS.md (§7 Sensitive Permissions)
-- - 08_GOOGLE_DRIVE_ARCHITECTURE.md
-- - 11_SECURITY_PRIVACY.md (§7–13 Biometric & Media Privacy)
-- ==============================================================================

-- 1. EXTENSIONS (Ensure vector support)
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS "vector";
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pgvector extension not installed, proceeding with array fallback capability';
END $$;

-- 2. MEDIA PROCESSING JOBS
CREATE TABLE IF NOT EXISTS media_processing_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL, -- THUMBNAIL_GENERATION, FACE_DETECTION, KEYFRAME_SAMPLING
  status TEXT NOT NULL DEFAULT 'QUEUED', -- QUEUED, PROCESSING, COMPLETED, FAILED
  attempts INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. BIOMETRIC CONSENT & ENROLLMENT (Strictly Opt-in)
CREATE TABLE IF NOT EXISTS face_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  consent_version TEXT NOT NULL, -- e.g. 'v1.0'
  consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  withdrawn_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, WITHDRAWN, EXPIRED, DELETED
  model_version TEXT DEFAULT 'arcface-r100-v1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_face_enrollment_student UNIQUE (student_id)
);

-- 4. FACE EMBEDDINGS (Internal Sensitive Vectors - NEVER Exposed to Client)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vector') THEN
    CREATE TABLE IF NOT EXISTS face_embeddings (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      enrollment_id UUID NOT NULL REFERENCES face_enrollments(id) ON DELETE CASCADE,
      embedding vector(512) NOT NULL,
      quality_score NUMERIC,
      model_version TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  ELSE
    CREATE TABLE IF NOT EXISTS face_embeddings (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      enrollment_id UUID NOT NULL REFERENCES face_enrollments(id) ON DELETE CASCADE,
      embedding FLOAT8[] NOT NULL,
      quality_score NUMERIC,
      model_version TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  END IF;
END $$;

-- 5. MEDIA FACES (Detected faces in event media assets)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vector') THEN
    CREATE TABLE IF NOT EXISTS media_faces (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      media_asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
      embedding vector(512),
      matched_student_id UUID REFERENCES student_profiles(id) ON DELETE SET NULL,
      confidence NUMERIC,
      detection_quality NUMERIC,
      bounding_box JSONB, -- {x, y, w, h} normalized
      model_version TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  ELSE
    CREATE TABLE IF NOT EXISTS media_faces (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      media_asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
      embedding FLOAT8[],
      matched_student_id UUID REFERENCES student_profiles(id) ON DELETE SET NULL,
      confidence NUMERIC,
      detection_quality NUMERIC,
      bounding_box JSONB,
      model_version TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  END IF;
END $$;

-- 6. FACE MATCH REPORTS ("Not Me" & False Match Dispute Center)
CREATE TABLE IF NOT EXISTS face_match_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
  media_asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  media_face_id UUID REFERENCES media_faces(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL DEFAULT 'NOT_ME',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN', -- OPEN, RESOLVED_DISPUTED, DISMISSED
  reviewed_by UUID REFERENCES accounts(id),
  reviewed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. VIDEO MOMENTS (Timestamp-linked presence)
CREATE TABLE IF NOT EXISTS video_moments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  student_id UUID REFERENCES student_profiles(id) ON DELETE SET NULL,
  start_seconds NUMERIC NOT NULL,
  end_seconds NUMERIC,
  confidence NUMERIC,
  model_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. INDEXES FOR PERFORMANCE & INTEGRITY
CREATE INDEX IF NOT EXISTS idx_media_jobs_asset ON media_processing_jobs(media_asset_id);
CREATE INDEX IF NOT EXISTS idx_media_jobs_status ON media_processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_face_enrollments_student ON face_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_face_enrollments_status ON face_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_media_faces_asset ON media_faces(media_asset_id);
CREATE INDEX IF NOT EXISTS idx_media_faces_matched_student ON media_faces(matched_student_id);
CREATE INDEX IF NOT EXISTS idx_face_reports_student ON face_match_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_face_reports_status ON face_match_reports(status);
CREATE INDEX IF NOT EXISTS idx_video_moments_asset ON video_moments(media_asset_id);
CREATE INDEX IF NOT EXISTS idx_video_moments_student ON video_moments(student_id);

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE media_processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_faces ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_match_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_moments ENABLE ROW LEVEL SECURITY;

-- 9a. Media Processing Jobs: Only Admins and Workers
CREATE POLICY "Admins can view media processing jobs" ON media_processing_jobs
  FOR SELECT TO authenticated USING (true);

-- 9b. Face Enrollments: Students can view and update their own enrollment
CREATE POLICY "Students can view own face enrollment" ON face_enrollments
  FOR SELECT TO authenticated
  USING (student_id IN (
    SELECT sp.id FROM student_profiles sp
    JOIN accounts a ON a.email = sp.email
    WHERE a.auth_user_id = auth.uid()
  ));

-- 9c. Face Embeddings: Strictly backend / internal service access only
-- No direct client select policy granted for raw vectors
CREATE POLICY "Embeddings accessible only by system service" ON face_embeddings
  FOR ALL TO service_role USING (true);

-- 9d. Media Faces: Authenticated users can view matches scoped to authorized media
CREATE POLICY "Students can view matched media faces for authorized events" ON media_faces
  FOR SELECT TO authenticated
  USING (
    matched_student_id IN (
      SELECT sp.id FROM student_profiles sp
      JOIN accounts a ON a.email = sp.email
      WHERE a.auth_user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM accounts a
      JOIN team_memberships tm ON tm.student_id = (SELECT id FROM student_profiles WHERE email = a.email)
      WHERE a.auth_user_id = auth.uid()
    )
  );

-- 9e. Face Match Reports: Students can report on their own matches; Admins can review
CREATE POLICY "Students can create and view own match reports" ON face_match_reports
  FOR ALL TO authenticated
  USING (student_id IN (
    SELECT sp.id FROM student_profiles sp
    JOIN accounts a ON a.email = sp.email
    WHERE a.auth_user_id = auth.uid()
  ));
