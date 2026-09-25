# AIML CLUB OCT — CONNECT
## Database Specification: Media & Biometric Intelligence (Phase 4)

### Schema Details: `20260925000004_media_intelligence.sql`

#### 1. `media_processing_jobs` Table
Tracks asynchronous processing tasks for media assets.
- `id` (UUID, Primary Key, default `uuid_generate_v4()`)
- `media_asset_id` (UUID, Foreign Key referencing `media_assets(id)` ON DELETE CASCADE)
- `job_type` (`THUMBNAIL_GENERATION`, `FACE_DETECTION`, `KEYFRAME_SAMPLING`)
- `status` (`QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`)
- `attempts` (INTEGER, default 0)
- `started_at` / `completed_at` (TIMESTAMPTZ)
- `error_message` (TEXT)
- `metadata` (JSONB)
- `created_at` (TIMESTAMPTZ)

#### 2. `face_enrollments` Table
Stores student biometric consent state.
- `id` (UUID, Primary Key)
- `student_id` (UUID, Foreign Key referencing `student_profiles(id)` ON DELETE CASCADE, UNIQUE)
- `consent_version` (TEXT, e.g. `'v1.0'`)
- `consented_at` (TIMESTAMPTZ, NOT NULL)
- `withdrawn_at` (TIMESTAMPTZ)
- `status` (`ACTIVE`, `WITHDRAWN`, `EXPIRED`, `DELETED`)
- `model_version` (TEXT, default `'arcface-r100-v1'`)
- `created_at` / `updated_at` (TIMESTAMPTZ)

#### 3. `face_embeddings` Table
Internal sensitive facial embedding vectors.
- `id` (UUID, Primary Key)
- `enrollment_id` (UUID, Foreign Key referencing `face_enrollments(id)` ON DELETE CASCADE)
- `embedding` (`vector(512)` or `FLOAT8[]` fallback)
- `quality_score` (NUMERIC)
- `model_version` (TEXT)
- `created_at` (TIMESTAMPTZ)
- **RLS Boundary**: Strictly restricted to `service_role`. No client select policy exists.

#### 4. `media_faces` Table
Detected faces in event media assets.
- `id` (UUID, Primary Key)
- `media_asset_id` (UUID, Foreign Key referencing `media_assets(id)` ON DELETE CASCADE)
- `embedding` (`vector(512)` or `FLOAT8[]`)
- `matched_student_id` (UUID, Foreign Key referencing `student_profiles(id)` ON DELETE SET NULL)
- `confidence` (NUMERIC)
- `detection_quality` (NUMERIC)
- `bounding_box` (JSONB: `{x, y, w, h}`)
- `model_version` (TEXT)
- `created_at` (TIMESTAMPTZ)

#### 5. `face_match_reports` Table
Dispute center for false positive detections ("Not Me").
- `id` (UUID, Primary Key)
- `student_id` (UUID, Foreign Key referencing `student_profiles(id)` ON DELETE CASCADE)
- `media_asset_id` (UUID, Foreign Key referencing `media_assets(id)` ON DELETE CASCADE)
- `media_face_id` (UUID, Foreign Key referencing `media_faces(id)` ON DELETE SET NULL)
- `report_type` (`NOT_ME`, `WRONG_PERSON`, `UNCONSENTED_INDEX`, `POOR_CROP`)
- `description` (TEXT)
- `status` (`OPEN`, `RESOLVED_DISPUTED`, `DISMISSED`)
- `reviewed_by` (UUID, referencing `accounts(id)`)
- `reviewed_at` (TIMESTAMPTZ)
- `resolution_notes` (TEXT)
- `created_at` (TIMESTAMPTZ)

#### 6. `video_moments` Table
Timestamp-indexed video appearances.
- `id` (UUID, Primary Key)
- `media_asset_id` (UUID, Foreign Key referencing `media_assets(id)` ON DELETE CASCADE)
- `student_id` (UUID, referencing `student_profiles(id)` ON DELETE SET NULL)
- `start_seconds` (NUMERIC, NOT NULL)
- `end_seconds` (NUMERIC)
- `confidence` (NUMERIC)
- `model_version` (TEXT)
- `created_at` (TIMESTAMPTZ)
