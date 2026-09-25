# AIML CLUB OCT — CONNECT
## Database Specification: Chronicle, Journey & Feedback

Migration: `20260925000007_chronicle_journey_feedback.sql`  
Baseline Prerequisites: `20260925000001` through `20260925000006`  
Date: 2026-09-25  
Status: Active & Validated

---

### 1. Schema Tables

#### Table: `chronicle_entries`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique publication identifier |
| `title` | TEXT | NOT NULL | Article/edition headline |
| `slug` | TEXT | UNIQUE, NOT NULL | URL-safe slug |
| `edition_type` | TEXT | NOT NULL DEFAULT 'COMMUNITY_UPDATE' | Editorial category |
| `excerpt` | TEXT | NULLABLE | Brief introductory summary |
| `content` | TEXT | NOT NULL | Markdown / structural text |
| `cover_media_id` | UUID | REFERENCES media_assets(id) ON DELETE SET NULL | Archival banner media |
| `visibility` | TEXT | NOT NULL DEFAULT 'PUBLIC' | 'PUBLIC', 'MEMBERS_ONLY', 'INTERNAL' |
| `status` | TEXT | NOT NULL DEFAULT 'DRAFT' | 'DRAFT', 'REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED' |
| `scheduled_at` | TIMESTAMPTZ | NULLABLE | Planned publication time |
| `published_at` | TIMESTAMPTZ | NULLABLE | Actual publication time |
| `created_by` | UUID | REFERENCES accounts(id) ON DELETE SET NULL | Author account ID |
| `approved_by` | UUID | REFERENCES accounts(id) ON DELETE SET NULL | Reviewer / approving editor |
| `seo_title` | TEXT | NULLABLE | Search & OG title |
| `seo_description` | TEXT | NULLABLE | Search & OG description |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Audit timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Audit timestamp |

#### Table: `event_chronicle_items`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Join record ID |
| `chronicle_id` | UUID | REFERENCES chronicle_entries(id) ON DELETE CASCADE | Associated publication |
| `event_id` | UUID | REFERENCES events(id) ON DELETE CASCADE | Canonical event reference |
| `display_order` | INTEGER | NOT NULL DEFAULT 0 | Sorting sequence |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Timestamp |

*Constraint*: `CONSTRAINT uq_chronicle_event UNIQUE (chronicle_id, event_id)`

#### Table: `journey_milestones`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Milestone ID |
| `title` | TEXT | NOT NULL | Milestone name |
| `slug` | TEXT | UNIQUE, NOT NULL | URL-safe slug |
| `milestone_date` | DATE | NOT NULL | Historical occurrence date |
| `milestone_type` | TEXT | NOT NULL DEFAULT 'EVENT' | 'FOUNDATION', 'EVENT', 'ACHIEVEMENT', 'PARTNERSHIP', etc. |
| `description` | TEXT | NULLABLE | Narrative details |
| `cover_media_id` | UUID | REFERENCES media_assets(id) ON DELETE SET NULL | Cover photograph |
| `linked_event_id` | UUID | REFERENCES events(id) ON DELETE SET NULL | Canonical event reference |
| `linked_project_id` | UUID | NULLABLE | Optional project reference |
| `external_link` | TEXT | NULLABLE | Press/circular link |
| `visibility` | TEXT | NOT NULL DEFAULT 'PUBLIC' | Access level |
| `status` | TEXT | NOT NULL DEFAULT 'PUBLISHED' | 'DRAFT', 'PUBLISHED', 'ARCHIVED' |
| `display_order` | INTEGER | NOT NULL DEFAULT 0 | Same-date sorting index |
| `published_at` | TIMESTAMPTZ | NULLABLE | Release timestamp |
| `created_by` | UUID | REFERENCES accounts(id) ON DELETE SET NULL | Creator account |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Timestamp |

#### Table: `feedback`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique feedback ID |
| `event_id` | UUID | REFERENCES events(id) ON DELETE CASCADE | Canonical event |
| `student_id` | UUID | REFERENCES student_profiles(id) ON DELETE RESTRICT | Submitting student |
| `participation_id` | UUID | REFERENCES event_participations(id) ON DELETE SET NULL | Event participation |
| `source` | TEXT | DEFAULT 'PORTAL' | 'PORTAL', 'PWA', 'TALLY', 'MANUAL' |
| `source_record_id` | TEXT | NULLABLE | Third-party source record ID |
| `rating` | INTEGER | NOT NULL CHECK (rating >= 1 AND rating <= 5) | Attendee star rating (1–5) |
| `feedback_text` | TEXT | NOT NULL | Qualitative review |
| `suggestion_text` | TEXT | NULLABLE | Improvement recommendations |
| `publication_consent` | TEXT | NOT NULL DEFAULT 'NO' | 'NO', 'ANONYMOUS', 'PUBLIC_NAME' |
| `is_anonymous` | BOOLEAN | NOT NULL DEFAULT FALSE | True if author is not publicly named |
| `moderation_status` | TEXT | NOT NULL DEFAULT 'PENDING' | 'PENDING', 'APPROVED', 'REJECTED' |
| `visibility` | TEXT | NOT NULL DEFAULT 'ADMIN_ONLY' | 'ADMIN_ONLY', 'PUBLIC' |
| `moderated_by` | UUID | REFERENCES accounts(id) ON DELETE SET NULL | Staff reviewer account |
| `moderated_at` | TIMESTAMPTZ | NULLABLE | Moderation decision time |
| `moderation_notes` | TEXT | NULLABLE | Internal staff notes |
| `submitted_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Submission timestamp |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Timestamp |

*Constraint*: `CONSTRAINT uq_event_student_feedback UNIQUE (event_id, student_id)`

---

### 2. Operational Indexes

- `idx_chronicle_slug ON chronicle_entries(slug)`
- `idx_chronicle_status_pub ON chronicle_entries(status, published_at DESC)`
- `idx_event_chronicle_entry ON event_chronicle_items(chronicle_id)`
- `idx_event_chronicle_event ON event_chronicle_items(event_id)`
- `idx_journey_slug ON journey_milestones(slug)`
- `idx_journey_date ON journey_milestones(milestone_date DESC, display_order ASC)`
- `idx_journey_status_vis ON journey_milestones(status, visibility)`
- `idx_journey_linked_event ON journey_milestones(linked_event_id)`
- `idx_feedback_event_mod ON feedback(event_id, moderation_status)`
- `idx_feedback_student ON feedback(student_id)`
- `idx_feedback_visibility ON feedback(visibility)`

---

### 3. Row-Level Security Policies

All 4 tables have RLS explicitly enabled. Authorization checks utilize the canonical `public.check_user_has_role(...)` function established in Migration `20260925000006`:

- **Chronicle**:
  - `Public can view published chronicle entries`: `status = 'PUBLISHED' AND visibility = 'PUBLIC'`
  - `Editorial staff can view all chronicle entries`: Role in (`SUPER_ADMIN`, `CLUB_ADMIN`, `CONTENT_MANAGER`)
  - `Editorial staff can manage chronicle entries`: Insert, Update, Delete for `SUPER_ADMIN`, `CLUB_ADMIN`, `CONTENT_MANAGER`
- **Journey**:
  - `Public can view published journey milestones`: `status = 'PUBLISHED' AND visibility = 'PUBLIC'`
  - `Staff can manage journey milestones`: Full access for `SUPER_ADMIN`, `CLUB_ADMIN`, `CONTENT_MANAGER`
- **Feedback**:
  - `Students can submit event feedback`: Authenticated students inserting records with their own `student_id`
  - `Students can view their own feedback`: Submitting student viewing their own record
  - `Public can view approved public feedback`: `moderation_status = 'APPROVED' AND visibility = 'PUBLIC' AND publication_consent IN ('ANONYMOUS', 'PUBLIC_NAME')`
  - `Staff can view and moderate event feedback`: `SUPER_ADMIN`, `CLUB_ADMIN`, `EVENT_MANAGER`, `CONTENT_MANAGER`
