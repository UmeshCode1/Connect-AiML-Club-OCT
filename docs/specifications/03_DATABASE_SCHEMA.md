# AIML Club OCT — Connect
## Database Schema

Version: 1.0

Database: PostgreSQL / Supabase

---

## 1. Schema Principles

1. Use UUID primary keys for internal database entities.
2. Use human-readable IDs only where users need them.
3. Use foreign keys for relationships.
4. Use timestamps on important entities.
5. Use soft deletion where historical/audit requirements require it.
6. Keep authentication records separate from student profiles.
7. Keep event participation separate from students.
8. Keep Google Drive IDs in dedicated fields.
9. Never store Google Drive folder names as identifiers.
10. Protect biometric/vector data through strict policies.

---

## 2. Core Entity Relationship

```text
Account
   │
   ├── StudentProfile
   │
   └── TeamMembership
             │
             ▼
           Team

StudentProfile
   │
   ├── EventParticipation ─── Event
   │                              │
   │                              ├── Attendance
   │                              ├── MediaAsset
   │                              ├── Certificate
   │                              ├── Feedback
   │                              ├── Document
   │                              └── Task
   │
   ├── FaceEnrollment
   └── Certificate

MediaAsset
   │
   ├── MediaFace
   └── VideoMoment

Certificate
   └── CertificateVerification

Event
   ├── ChronicleReference
   └── JourneyReference
```

---

## 3. accounts

Authentication/application account mapping.

```sql
accounts (
  id uuid primary key,
  auth_user_id uuid unique not null,
  email text,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
```

Statuses:

- ACTIVE
- SUSPENDED
- DISABLED

Do not store passwords here if Supabase Auth is used.

---

## 4. student_profiles

Stable person/student record.

```sql
student_profiles (
  id uuid primary key,
  student_code text unique,
  enrollment_number text unique,
  full_name text not null,
  email text,
  phone text,
  department text,
  course text,
  batch text,
  semester text,
  avatar_media_id uuid,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
```

`student_code` example:

`STU-000184`

Avoid using email as the primary identity.

---

## 5. team_roles

Configurable role definitions.

```sql
team_roles (
  id uuid primary key,
  name text unique not null,
  description text,
  permissions jsonb not null default '{}',
  created_at timestamptz not null default now()
)
```

Examples:

- President
- Vice President
- Secretary
- Technical Lead
- Event Coordinator
- Media Lead
- Design Lead
- Content Lead
- Volunteer

---

## 6. team_memberships

```sql
team_memberships (
  id uuid primary key,
  student_id uuid not null references student_profiles(id),
  role_id uuid references team_roles(id),
  start_date date,
  end_date date,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now()
)
```

A person may have historical team memberships.

Do not overwrite historical leadership records.

---

## 7. events

```sql
events (
  id uuid primary key,
  event_code text unique not null,
  slug text unique not null,
  title text not null,
  short_description text,
  description text,
  event_type text,
  status text not null default 'DRAFT',
  visibility text not null default 'PUBLIC',
  cover_media_id uuid,
  venue text,
  start_at timestamptz,
  end_at timestamptz,
  registration_open_at timestamptz,
  registration_close_at timestamptz,
  capacity integer,
  published_at timestamptz,
  created_by uuid references accounts(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
```

Example event code:

`EVT-APTIFY-2026`

---

## 8. event_participations

This is the central event/student relationship.

```sql
event_participations (
  id uuid primary key,
  event_id uuid not null references events(id),
  student_id uuid not null references student_profiles(id),
  registration_source text,
  source_record_id text,
  registration_status text not null default 'REGISTERED',
  event_role text,
  team_name text,
  result text,
  notes text,
  registered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(event_id, student_id)
)
```

Registration statuses may include:

- REGISTERED
- WAITLISTED
- CANCELLED
- REJECTED
- WALK_IN
- COMPLETED

---

## 9. attendance_records

```sql
attendance_records (
  id uuid primary key,
  event_id uuid not null references events(id),
  student_id uuid not null references student_profiles(id),
  participation_id uuid references event_participations(id),
  check_in_at timestamptz,
  check_out_at timestamptz,
  status text not null default 'PRESENT',
  source text,
  corrected_by uuid references accounts(id),
  correction_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
```

Statuses:

- PRESENT
- ABSENT
- EXCUSED
- LATE
- LEFT_EARLY

Unique constraint should prevent duplicate active attendance records for the same event/person unless multiple sessions are intentionally supported.

---

## 10. volunteer_assignments

```sql
volunteer_assignments (
  id uuid primary key,
  event_id uuid not null references events(id),
  student_id uuid not null references student_profiles(id),
  role text,
  assigned_by uuid references accounts(id),
  status text not null default 'ASSIGNED',
  created_at timestamptz not null default now()
)
```

---

## 11. media_assets

```sql
media_assets (
  id uuid primary key,
  event_id uuid references events(id),
  media_type text not null,
  title text,
  original_filename text,
  mime_type text,
  file_size bigint,
  checksum text,
  google_drive_file_id text unique,
  google_drive_folder_id text,
  visibility text not null default 'EVENT_MEMBERS',
  processing_status text not null default 'UPLOADED',
  width integer,
  height integer,
  duration_seconds numeric,
  uploaded_by uuid references accounts(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
```

---

## 12. media_processing_jobs

```sql
media_processing_jobs (
  id uuid primary key,
  media_asset_id uuid not null references media_assets(id),
  job_type text not null,
  status text not null default 'QUEUED',
  attempts integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  metadata jsonb,
  created_at timestamptz not null default now()
)
```

---

## 13. face_enrollments

Biometric enrollment.

```sql
face_enrollments (
  id uuid primary key,
  student_id uuid not null references student_profiles(id),
  consent_version text not null,
  consented_at timestamptz not null,
  withdrawn_at timestamptz,
  status text not null default 'ACTIVE',
  model_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
```

---

## 14. face_embeddings

Sensitive biometric/vector information.

```sql
face_embeddings (
  id uuid primary key,
  enrollment_id uuid not null references face_enrollments(id),
  embedding vector(EMBEDDING_DIMENSION) not null,
  quality_score numeric,
  model_version text not null,
  created_at timestamptz not null default now()
)
```

Replace `EMBEDDING_DIMENSION` with the selected model's actual dimension.

This table must have strict RLS and backend-only access wherever possible.

---

## 15. media_faces

Associates a detected face with a media asset.

```sql
media_faces (
  id uuid primary key,
  media_asset_id uuid not null references media_assets(id),
  embedding vector(EMBEDDING_DIMENSION),
  matched_student_id uuid references student_profiles(id),
  confidence numeric,
  detection_quality numeric,
  model_version text,
  created_at timestamptz not null default now()
)
```

For privacy, consider whether storing a second embedding here is necessary. If it is not necessary, store only a protected reference/index representation.

---

## 16. face_match_reports

```sql
face_match_reports (
  id uuid primary key,
  student_id uuid not null references student_profiles(id),
  media_asset_id uuid not null references media_assets(id),
  report_type text not null,
  description text,
  status text not null default 'OPEN',
  reviewed_by uuid references accounts(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
)
```

Example report:

`NOT_ME`

---

## 17. video_moments

```sql
video_moments (
  id uuid primary key,
  media_asset_id uuid not null references media_assets(id),
  student_id uuid references student_profiles(id),
  start_seconds numeric not null,
  end_seconds numeric,
  confidence numeric,
  model_version text,
  created_at timestamptz not null default now()
)
```

---

## 18. certificate_templates

```sql
certificate_templates (
  id uuid primary key,
  name text not null,
  certificate_type text not null,
  google_drive_file_id text,
  configuration jsonb not null default '{}',
  version integer not null default 1,
  status text not null default 'DRAFT',
  created_by uuid references accounts(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
```

The configuration may contain field positions and formatting.

---

## 19. certificates

```sql
certificates (
  id uuid primary key,
  certificate_id text unique not null,
  verification_token_hash text unique not null,
  student_id uuid not null references student_profiles(id),
  event_id uuid references events(id),
  certificate_type text not null,
  template_id uuid references certificate_templates(id),
  google_drive_file_id text,
  status text not null default 'GENERATED',
  issued_at timestamptz,
  issued_by uuid references accounts(id),
  replaced_by uuid references certificates(id),
  revoked_at timestamptz,
  revoke_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
```

Do not store the raw verification secret if a secure hash is sufficient.

---

## 20. feedback

```sql
feedback (
  id uuid primary key,
  event_id uuid references events(id),
  student_id uuid references student_profiles(id),
  source text,
  source_record_id text,
  rating numeric,
  feedback_text text,
  suggestion_text text,
  publication_consent text not null default 'NO',
  visibility text not null default 'ADMIN_ONLY',
  submitted_at timestamptz,
  created_at timestamptz not null default now()
)
```

---

## 21. documents

```sql
documents (
  id uuid primary key,
  event_id uuid references events(id),
  title text not null,
  document_type text,
  google_drive_file_id text,
  visibility text not null default 'TEAM_ONLY',
  uploaded_by uuid references accounts(id),
  created_at timestamptz not null default now()
)
```

---

## 22. tasks

```sql
tasks (
  id uuid primary key,
  event_id uuid references events(id),
  title text not null,
  description text,
  assigned_to uuid references accounts(id),
  status text not null default 'TODO',
  priority text not null default 'NORMAL',
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
```

---

## 23. journey_milestones

```sql
journey_milestones (
  id uuid primary key,
  title text not null,
  slug text unique not null,
  milestone_date date,
  milestone_type text,
  description text,
  cover_media_id uuid references media_assets(id),
  linked_event_id uuid references events(id),
  linked_project_id uuid,
  visibility text not null default 'PUBLIC',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
```

---

## 24. projects

```sql
projects (
  id uuid primary key,
  slug text unique not null,
  title text not null,
  summary text,
  description text,
  status text,
  repository_url text,
  demo_url text,
  documentation_url text,
  cover_media_id uuid references media_assets(id),
  visibility text not null default 'PUBLIC',
  created_by uuid references accounts(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
```

---

## 25. project_members

```sql
project_members (
  id uuid primary key,
  project_id uuid not null references projects(id),
  student_id uuid not null references student_profiles(id),
  role text,
  created_at timestamptz not null default now(),
  unique(project_id, student_id)
)
```

---

## 26. research_items

```sql
research_items (
  id uuid primary key,
  slug text unique not null,
  title text not null,
  abstract text,
  authors jsonb,
  methodology text,
  publication_url text,
  repository_url text,
  dataset_url text,
  visibility text not null default 'PUBLIC',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
```

---

## 27. learning_resources

```sql
learning_resources (
  id uuid primary key,
  title text not null,
  slug text unique not null,
  resource_type text,
  description text,
  url text,
  event_id uuid references events(id),
  visibility text not null default 'PUBLIC',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
```

---

## 28. chronicle_entries

```sql
chronicle_entries (
  id uuid primary key,
  title text not null,
  slug text unique not null,
  edition_type text,
  excerpt text,
  content text,
  cover_media_id uuid references media_assets(id),
  visibility text not null default 'PUBLIC',
  status text not null default 'DRAFT',
  published_at timestamptz,
  created_by uuid references accounts(id),
  approved_by uuid references accounts(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
```

---

## 29. event_chronicle_items

```sql
event_chronicle_items (
  id uuid primary key,
  chronicle_id uuid not null references chronicle_entries(id),
  event_id uuid not null references events(id),
  display_order integer not null default 0,
  unique(chronicle_id, event_id)
)
```

---

## 30. drive_folders

```sql
drive_folders (
  id uuid primary key,
  event_id uuid references events(id),
  folder_type text not null,
  google_drive_folder_id text unique not null,
  created_at timestamptz not null default now()
)
```

Example folder types:

- EVENT_ROOT
- PHOTOS
- VIDEOS
- CERTIFICATES
- DOCUMENTS
- RESOURCES

---

## 31. integration_sources

```sql
integration_sources (
  id uuid primary key,
  provider text not null,
  name text not null,
  status text not null default 'ACTIVE',
  configuration jsonb,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)
```

Never store raw secrets in ordinary configuration JSON.

Use a secure secret manager.

---

## 32. sync_runs

```sql
sync_runs (
  id uuid primary key,
  integration_source_id uuid not null references integration_sources(id),
  sync_type text not null,
  status text not null default 'RUNNING',
  records_seen integer default 0,
  records_created integer default 0,
  records_updated integer default 0,
  records_failed integer default 0,
  error_summary text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
)
```

---

## 33. data_conflicts

```sql
data_conflicts (
  id uuid primary key,
  entity_type text not null,
  entity_id uuid,
  field_name text not null,
  existing_value jsonb,
  incoming_value jsonb,
  source text,
  status text not null default 'OPEN',
  resolved_by uuid references accounts(id),
  resolved_at timestamptz,
  resolution text,
  created_at timestamptz not null default now()
)
```

---

## 34. audit_logs

```sql
audit_logs (
  id uuid primary key,
  actor_account_id uuid references accounts(id),
  action text not null,
  resource_type text,
  resource_id uuid,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb,
  ip_hash text,
  created_at timestamptz not null default now()
)
```

Avoid storing raw sensitive request data.

---

## 35. notification_records

```sql
notification_records (
  id uuid primary key,
  account_id uuid references accounts(id),
  channel text not null,
  template_key text,
  subject text,
  status text not null,
  provider_message_id text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
)
```

Channels:

- IN_APP
- EMAIL
- WHATSAPP

WhatsApp should only be implemented through an approved official business API.

---

## 36. Indexing Requirements

Create indexes for:

```text
events.slug
events.status
events.start_at

student_profiles.enrollment_number
student_profiles.email
student_profiles.student_code

event_participations.event_id
event_participations.student_id
event_participations.registration_status

attendance_records.event_id
attendance_records.student_id

media_assets.event_id
media_assets.processing_status
media_assets.google_drive_file_id

certificates.certificate_id
certificates.student_id
certificates.event_id
certificates.status

feedback.event_id

journey_milestones.slug
chronicle_entries.slug
projects.slug
research_items.slug
learning_resources.slug
```

Use vector indexes appropriate to the selected pgvector distance/operator and dataset size.

---

## 37. Row Level Security

Supabase RLS should protect:

Public:

- published public events
- published chronicle
- published journey
- public projects
- public research
- public learning
- public certificate verification

Authenticated student:

- own profile
- own event participation
- own attendance
- own certificates
- authorized memories

Event team:

- authorized event records

Admin:

- assigned administrative scope

Biometric data:

- never public
- preferably backend-only access

---

## 38. Data Retention

Retention policy must be defined before production.

Potential categories:

- Event records: long-term
- Certificates: long-term
- Audit logs: long-term according to policy
- Raw registration records: policy-defined
- Face embeddings: only while consent/service requires
- Temporary processing artifacts: short-term
- Failed processing files: cleanup policy

Do not delete historical data merely because it is not currently displayed.

---

## 39. Migration Strategy

Do not import legacy data directly into production tables without validation.

Preferred:

```text
Legacy Data
   ↓
Staging Tables
   ↓
Normalize
   ↓
Validate
   ↓
Deduplicate
   ↓
Map IDs
   ↓
Review
   ↓
Production
```

Preserve source identifiers where possible.

---

## 40. Database Design Rule

The database should model real relationships, not UI screens.

Do not create a table merely because a page exists.

Do not duplicate the same student/event/project information across multiple modules.

Use canonical entities and relationships.
