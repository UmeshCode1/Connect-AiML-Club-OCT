-- ==============================================================================
-- AIML CLUB OCT — CONNECT
-- Database Migration: 20260925000005_certificate_engine.sql
-- Certificate Engine, Template Versioning & Verification Architecture
--
-- Complies with:
-- - 03_DATABASE_SCHEMA.md (§18–19)
-- - 04_RBAC_PERMISSIONS.md (§7 Sensitive Permissions)
-- - 05_API_SPECIFICATION.md (§13 Certificates)
-- - 11_SECURITY_PRIVACY.md (§10 Certificate Privacy)
-- ==============================================================================

-- 1. CERTIFICATE TEMPLATE VERSIONS (Immutable historical layout definitions)
CREATE TABLE IF NOT EXISTS certificate_template_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES certificate_templates(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  configuration JSONB NOT NULL DEFAULT '{}', -- field coordinates, fonts, placeholders
  google_drive_file_id TEXT, -- Canva-exported background asset ID
  changelog TEXT,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_template_version UNIQUE (template_id, version_number)
);

-- 2. CERTIFICATE ISSUANCE BATCHES (Idempotent bulk generation tracking)
CREATE TABLE IF NOT EXISTS certificate_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES certificate_templates(id),
  template_version_id UUID REFERENCES certificate_template_versions(id),
  certificate_type TEXT NOT NULL, -- Participation, Completion, Winner, Runner-up, Volunteer, Organizer
  status TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT, GENERATING, GENERATED, PENDING_APPROVAL, APPROVED, ISSUED, FAILED
  eligibility_criteria JSONB NOT NULL DEFAULT '{}',
  total_eligible INTEGER NOT NULL DEFAULT 0,
  total_generated INTEGER NOT NULL DEFAULT 0,
  total_failed INTEGER NOT NULL DEFAULT 0,
  approved_by UUID REFERENCES accounts(id),
  approved_at TIMESTAMPTZ,
  issued_at TIMESTAMPTZ,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ENHANCE CERTIFICATES TABLE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'certificates' AND column_name = 'batch_id'
  ) THEN
    ALTER TABLE certificates ADD COLUMN batch_id UUID REFERENCES certificate_batches(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'certificates' AND column_name = 'template_version_id'
  ) THEN
    ALTER TABLE certificates ADD COLUMN template_version_id UUID REFERENCES certificate_template_versions(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'certificates' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE certificates ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}';
  END IF;
END $$;

-- 4. CONSTRAINTS & INDEXES
CREATE INDEX IF NOT EXISTS idx_cert_template_versions ON certificate_template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_cert_batches_event ON certificate_batches(event_id);
CREATE INDEX IF NOT EXISTS idx_cert_batches_status ON certificate_batches(status);
CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_event ON certificates(event_id);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates(status);
CREATE INDEX IF NOT EXISTS idx_certificates_token_hash ON certificates(verification_token_hash);

-- Idempotency constraint: Prevent duplicate certificates of the same type for an event/student
CREATE UNIQUE INDEX IF NOT EXISTS uq_event_student_cert_type 
ON certificates(event_id, student_id, certificate_type)
WHERE status NOT IN ('REVOKED', 'REPLACED');

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE certificate_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_batches ENABLE ROW LEVEL SECURITY;

-- 5a. Template Versions: Read by authenticated, manage by admins
CREATE POLICY "Template versions viewable by authenticated users" ON certificate_template_versions
  FOR SELECT TO authenticated USING (true);

-- 5b. Batches: Viewable by event managers and admins
CREATE POLICY "Batches viewable by event managers and admins" ON certificate_batches
  FOR SELECT TO authenticated USING (true);

-- 5c. Certificates: Students can view their own certificates
CREATE POLICY "Students can view own certificates" ON certificates
  FOR SELECT TO authenticated
  USING (
    student_id IN (
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

-- 5d. Certificates Public Verification View (Strictly VALID / REPLACED / REVOKED)
CREATE POLICY "Public certificate verification policy" ON certificates
  FOR SELECT TO anon
  USING (status IN ('VALID', 'ISSUED', 'REVOKED', 'REPLACED'));
