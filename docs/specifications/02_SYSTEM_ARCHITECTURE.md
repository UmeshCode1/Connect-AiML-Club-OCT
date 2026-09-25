# AIML Club OCT — Connect
## System Architecture

Version: 1.0

---

## 1. Architecture Overview

Connect is a modular platform with a shared backend and database.

Recommended high-level architecture:

```text
                    PUBLIC INTERNET
                          │
              ┌───────────┴───────────┐
              │                       │
       aimlcluboct.in          app.aimlcluboct.in
       Public Website           Connect PWA
              │                       │
              └───────────┬───────────┘
                          │
                    api.aimlcluboct.in
                          │
              ┌───────────┼───────────┐
              │           │           │
          Auth/API      Workers     Integrations
              │           │           │
              ▼           ▼           ▼
         PostgreSQL   AI Processing  Tally
         + pgvector   Media Jobs     Sheets
              │           │           │
              └───────────┼───────────┘
                          │
                     Google Drive
```

---

## 2. Recommended Stack

Frontend:

- Next.js
- React
- TypeScript
- Tailwind CSS or existing repository styling system
- PWA support

Backend:

- FastAPI
- Python
- Pydantic
- Background job processing

Database:

- PostgreSQL
- Supabase
- pgvector
- PostgreSQL full-text search
- pg_trgm

Storage:

- Google Drive

Authentication:

- Supabase Auth or equivalent approved authentication layer

AI/media:

- Python
- OpenCV
- Face detection/embedding model selected after benchmark
- Video processing pipeline

Deployment:

- Web: Vercel or existing approved deployment
- API/workers: Render, Cloud Run, or equivalent
- Database: Supabase

Do not introduce additional infrastructure until there is a documented reason.

---

## 3. Repository Architecture

Target logical structure:

```text
apps/
  web/
  admin/
  api/

packages/
  ui/
  types/
  config/
  utils/

services/
  face-processing/
  video-processing/
  certificate-engine/
  google-drive/
  google-sheets/
  tally/
  notifications/

database/
  migrations/
  seeds/
  policies/

docs/
infrastructure/
tests/
```

If the existing repository differs, audit first and migrate incrementally.

---

## 4. Frontend Architecture

The frontend should consume API contracts rather than directly accessing privileged infrastructure.

Public experience:

- Events
- Journey
- Chronicle
- Projects
- Research
- Learning
- Team
- Certificate verification

Authenticated app:

- Dashboard
- My Events
- My Certificates
- My Memories
- Attendance
- Profile
- Face enrollment/privacy
- Notifications

Admin:

- Overview
- Events
- Participants
- Attendance
- Media
- Certificates
- Feedback
- Chronicle
- Journey
- Projects
- Research
- Members
- Integrations
- Analytics
- Settings
- Audit Logs

---

## 5. Backend Architecture

Recommended API domains:

```text
/auth
/students
/members
/events
/participants
/attendance
/volunteers
/media
/photos
/videos
/face
/certificates
/verification
/feedback
/chronicle
/journey
/projects
/research
/learning
/documents
/tasks
/communications
/search
/analytics
/integrations
/audit
/admin
```

Keep business rules in the backend.

Do not implement security-critical rules only in frontend code.

---

## 6. Background Jobs

Long-running operations must not block HTTP requests.

Use background workers for:

- Drive synchronization
- Photo indexing
- Face detection
- Embedding generation
- Video analysis
- Certificate generation
- Large imports
- Reports
- Email batches
- Media quality analysis

Example:

```text
POST /events/{event_id}/media/process

        ↓

Create Job
        ↓
Return job_id
        ↓
Worker processes
        ↓
Update job status
        ↓
UI polls/subscribes
```

Job states:

`QUEUED → RUNNING → SUCCEEDED`

Failure:

`FAILED`

Allow retry when safe.

---

## 7. Event Domain

Event is the primary aggregate.

```text
Event
 ├── EventParticipants
 ├── Attendance
 ├── Volunteers
 ├── Media
 ├── Certificates
 ├── Feedback
 ├── Documents
 ├── Tasks
 ├── Announcements
 └── Reports
```

Use foreign keys rather than duplicated event names.

---

## 8. Media Architecture

Google Drive stores the actual large file.

PostgreSQL stores metadata.

```text
Google Drive
    │
    │ file_id
    ▼
MediaAsset
    │
    ├── Event
    ├── Processing
    ├── Visibility
    ├── Face references
    └── User access
```

Never expose privileged Drive credentials.

Prefer signed/authorized access patterns where required.

---

## 9. Face Recognition Architecture

Enrollment:

```text
Student
  ↓
Consent
  ↓
Camera/Image
  ↓
Face Detection
  ↓
Quality Check
  ↓
Embedding
  ↓
Encrypted/protected storage
```

Event indexing:

```text
Drive Photo
  ↓
Media Worker
  ↓
Face Detection
  ↓
Embedding
  ↓
Vector Index
  ↓
MediaFace
```

Search:

```text
Student
  ↓
Authenticated request
  ↓
Query embedding
  ↓
Vector similarity
  ↓
Authorized event/media filtering
  ↓
Rank results
  ↓
Gallery
```

Authorization filtering must happen before returning media results.

---

## 10. Face Privacy

Store only what is required.

Required controls:

- Consent timestamp
- Consent version
- Enrollment status
- Deletion request
- Retention policy
- Processing version

Face embeddings must not be public.

A student must be able to withdraw from the service according to the club's defined policy.

---

## 11. Video Architecture

Video processing should be asynchronous.

```text
Video
 ↓
Key-frame extraction
 ↓
Face detection
 ↓
Tracking
 ↓
Embedding
 ↓
Timestamp references
 ↓
VideoMoment records
```

Do not create separate copies of videos for each person.

---

## 12. Certificate Architecture

Certificate service responsibilities:

- Template storage
- Template configuration
- Field placement
- Rendering
- QR generation
- Unique ID generation
- Verification token generation
- PDF generation
- Drive upload
- Status management

Certificate generation should be idempotent.

Repeated jobs must not create uncontrolled duplicate certificates.

---

## 13. Google Drive Integration

Drive folder creation:

```text
Create Event
      ↓
Create root event folder
      ↓
Create:
Photos
Videos
Certificates
Documents
Resources
      ↓
Store folder IDs
```

Store:

- root_folder_id
- photos_folder_id
- videos_folder_id
- certificates_folder_id
- documents_folder_id
- resources_folder_id

Do not depend on folder names to locate folders later.

---

## 14. Tally Integration

Preferred flow:

```text
Tally
  ↓
Webhook/API
  ↓
Integration Service
  ↓
Normalize Data
  ↓
Validate
  ↓
Upsert Student
  ↓
Create EventParticipation
```

Google Sheets can remain a second operational synchronization path.

All external records should retain:

- source
- source_record_id
- last_synced_at
- sync status

---

## 15. Conflict Resolution

If Tally, Sheets, and manual data differ:

Do not silently overwrite.

Create a conflict record.

Example:

```text
Field: phone
Existing: 98xxxxxx21
Incoming: 97xxxxxx88

Status: REVIEW_REQUIRED
```

Admin can:

- Keep existing
- Accept incoming
- Manually edit
- Ignore

---

## 16. Authentication and Authorization

Authentication answers:

"Who are you?"

Authorization answers:

"What are you allowed to do?"

Attendance answers:

"Did you attend this event?"

These are three different concepts.

Use RBAC plus event-scoped permissions.

Recommended roles:

```text
SUPER_ADMIN
CLUB_ADMIN
EVENT_MANAGER
MEDIA_MANAGER
CERTIFICATE_MANAGER
CONTENT_MANAGER
VOLUNTEER
VIEWER
```

---

## 17. API Security

Never expose:

- Supabase service-role keys
- Google service credentials
- Private API secrets
- Face embeddings
- Internal storage credentials

Frontend receives only data authorized for the current user.

Use:

- Authentication
- Authorization
- Rate limiting
- Input validation
- Audit logging
- CORS policy
- CSRF protections where applicable
- Secure headers
- Secret management

---

## 18. Audit Architecture

Sensitive actions generate audit events.

Example:

```json
{
  "actor_id": "...",
  "action": "CERTIFICATE_ISSUED",
  "resource_type": "certificate",
  "resource_id": "...",
  "timestamp": "...",
  "metadata": {}
}
```

Audit records should be append-oriented.

Avoid allowing ordinary admins to rewrite history.

---

## 19. Search Architecture

Use:

- PostgreSQL FTS for textual search
- pg_trgm for fuzzy matching
- pgvector for semantic/embedding use cases

Search index should contain only searchable, authorized content.

Do not expose private data through autocomplete.

---

## 20. Notifications

Create a unified notification abstraction.

Channels:

- In-app
- Email
- Future WhatsApp Business Platform
- Admin announcements

Do not hard-code notification logic into individual modules.

---

## 21. Storage and Backup

Google Drive is storage, not a complete backup strategy.

Back up:

- Database
- Certificate metadata
- Event metadata
- Consent records
- Face-index metadata
- Important configuration
- Critical documents/media according to defined retention policy

Track storage usage.

Do not duplicate huge files unnecessarily.

---

## 22. Observability

Production deployment should eventually include:

- Application logs
- API error tracking
- Worker/job logs
- Database monitoring
- Storage monitoring
- Job retry monitoring
- Authentication/security events

Sensitive data must not be written into logs unnecessarily.

---

## 23. Deployment Environments

At minimum:

```text
development
staging
production
```

Never use production credentials in local development.

Environment variables:

```text
NEXT_PUBLIC_*
SUPABASE_*
GOOGLE_*
TALLY_*
EMAIL_*
AI_*
```

Secrets must remain server-side unless explicitly public.

---

## 24. Scaling Strategy

Initial scale should optimize for simplicity.

Start with:

- PostgreSQL/Supabase
- One API service
- One worker
- Google Drive
- Vector search in PostgreSQL

Scale only when actual workload requires:

- Multiple workers
- Dedicated queues
- Dedicated vector database
- CDN
- Separate media processors
- Dedicated search service

Avoid premature microservices.

---

## 25. Architecture Rule

Prefer a modular monolith first.

Separate services only when:

- workload is independently scalable,
- security boundary requires it,
- deployment lifecycle requires it,
- or processing is materially different.

Do not create microservices for organizational aesthetics.
