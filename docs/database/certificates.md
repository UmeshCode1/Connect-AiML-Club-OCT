# AIML CLUB OCT — CONNECT
## Phase 5 Database Specification: Certificate Engine & Verification System

Version: 1.4.0  
Migration: `supabase/migrations/20260925000005_certificate_engine.sql`

---

### 1. Schema Diagram & Relationships

```
events (id)
  │
  ├──< certificate_templates (id)
  │      └──< certificate_template_versions (id)
  │
  └──< certificate_batches (id)
         │
         └──< certificates (id, certificate_id, verification_token_hash)
                ├── references event_participations / students
                ├── references certificate_template_versions
                └── references certificate_batches
```

---

### 2. Table Definitions

#### `certificate_templates`
Stores top-level certificate template definitions.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Template identifier |
| `name` | `TEXT` | `NOT NULL` | Template title |
| `certificate_type` | `TEXT` | `NOT NULL` | `PARTICIPATION`, `MERIT`, `WINNER`, etc. |
| `google_drive_file_id`| `TEXT` | `NOT NULL` | Canva/Drive background vector/asset ID |
| `configuration` | `JSONB` | `NOT NULL DEFAULT '{}'` | Coordinates, typography, formatting |
| `version` | `INTEGER` | `NOT NULL DEFAULT 1` | Current active version number |
| `status` | `TEXT` | `NOT NULL DEFAULT 'ACTIVE'` | `ACTIVE`, `DEPRECATED` |
| `created_by` | `UUID` | `REFERENCES auth.users(id)` | Creator user account |
| `created_at` | `TIMESTAMPTZ`| `NOT NULL DEFAULT NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ`| `NOT NULL DEFAULT NOW()` | Modification timestamp |

#### `certificate_template_versions`
Immutable version snapshots for historical auditability and exact credential reproduction.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Version record identifier |
| `template_id` | `UUID` | `REFERENCES certificate_templates(id) ON DELETE CASCADE` | Parent template |
| `version_number`| `INTEGER` | `NOT NULL` | Version sequence integer |
| `configuration` | `JSONB` | `NOT NULL` | Immutable coordinates snapshot |
| `google_drive_file_id` | `TEXT` | `NULL` | Optional version asset ID |
| `created_by` | `UUID` | `REFERENCES auth.users(id)` | Author |
| `created_at` | `TIMESTAMPTZ`| `NOT NULL DEFAULT NOW()` | Creation timestamp |

*Constraint:* `UNIQUE (template_id, version_number)`

#### `certificate_batches`
Tracks bulk worker generation runs and approval gates.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Batch identifier |
| `event_id` | `UUID` | `REFERENCES events(id) ON DELETE CASCADE` | Associated event |
| `template_id` | `UUID` | `REFERENCES certificate_templates(id)` | Base template |
| `template_version_id`| `UUID` | `REFERENCES certificate_template_versions(id)` | Specific version |
| `certificate_type`| `TEXT` | `NOT NULL` | Type issued in this batch |
| `total_recipients`| `INTEGER` | `NOT NULL DEFAULT 0` | Eligible recipient count |
| `total_generated` | `INTEGER` | `NOT NULL DEFAULT 0` | Rendered output count |
| `total_failed` | `INTEGER` | `NOT NULL DEFAULT 0` | Failed rendering count |
| `status` | `TEXT` | `NOT NULL DEFAULT 'DRAFT'` | State machine enum |
| `criteria` | `JSONB` | `NOT NULL DEFAULT '{}'` | Attendance session minimums |
| `approved_by` | `UUID` | `REFERENCES auth.users(id)` | Approving admin |
| `approved_at` | `TIMESTAMPTZ`| `NULL` | Approval timestamp |
| `issued_by` | `UUID` | `REFERENCES auth.users(id)` | Issuing admin |
| `issued_at` | `TIMESTAMPTZ`| `NULL` | Public publication timestamp |
| `created_at` | `TIMESTAMPTZ`| `NOT NULL DEFAULT NOW()` | Creation timestamp |

#### `certificates` (Expanded)
Individual credential records.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Primary record key |
| `certificate_id` | `TEXT` | `NOT NULL UNIQUE` | Human-readable ID (`AIML26-APT-000184`) |
| `verification_token_hash`| `TEXT` | `NOT NULL UNIQUE` | Cryptographic SHA-256 token hash |
| `student_id` | `UUID` | `REFERENCES auth.users(id)` | Student recipient account |
| `recipient_name` | `TEXT` | `NOT NULL` | Participant full name |
| `event_id` | `UUID` | `REFERENCES events(id) ON DELETE CASCADE` | Associated event |
| `event_title` | `TEXT` | `NOT NULL` | Event title snapshot |
| `event_date` | `TEXT` | `NULL` | Event date snapshot |
| `certificate_type`| `TEXT` | `NOT NULL` | Type enum |
| `template_id` | `UUID` | `REFERENCES certificate_templates(id)` | Base template reference |
| `template_version_id`| `UUID` | `REFERENCES certificate_template_versions(id)` | Immutable version reference |
| `batch_id` | `UUID` | `REFERENCES certificate_batches(id)` | Generating batch reference |
| `google_drive_file_id`| `TEXT` | `NULL` | Generated PDF file ID |
| `status` | `TEXT` | `NOT NULL DEFAULT 'DRAFT'` | `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `ISSUED`, `REVOKED`, `REPLACED` |
| `issued_at` | `TIMESTAMPTZ`| `NULL` | Public issue timestamp |
| `issued_by` | `UUID` | `REFERENCES auth.users(id)` | Issuing authority |
| `replaced_by` | `TEXT` | `NULL` | Superseding certificate ID |
| `revoked_at` | `TIMESTAMPTZ`| `NULL` | Revocation timestamp |
| `revoke_reason` | `TEXT` | `NULL` | Mandatory revocation reason |

*Unique Idempotency Index:*
```sql
CREATE UNIQUE INDEX uq_event_student_cert_type 
ON certificates (event_id, student_id, certificate_type);
```

---

### 3. Row-Level Security (RLS) Policies

All certificate tables enforce PostgreSQL Row-Level Security:

1. **Student Isolation (`r_student_own_certificates`)**:
   `auth.uid() = student_id AND status IN ('ISSUED', 'VALID', 'REVOKED', 'REPLACED')`
2. **Event & Certificate Manager Access (`r_cert_manager_manage`)**:
   Enforced via backend RBAC roles (`SUPER_ADMIN`, `CLUB_ADMIN`, `CERTIFICATE_MANAGER`, `EVENT_MANAGER`).
3. **Public Verification Barrier**:
   Anonymous access to raw tables is **strictly denied**. Public verification occurs exclusively via `/v1/public/certificates/verify/{certificate_id}`, which filters fields to prevent PII harvesting.
