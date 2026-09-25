# AIML CLUB OCT — CONNECT
## Phase 5 Architecture: Certificate Engine & Verification System

Version: 1.4.0  
Date: 2026-09-25  
Status: Implemented & Validated

---

### 1. Architectural Overview

The Certificate Engine & Verification System powers the generation, issuance, lifecycle management, and cryptographic verification of official institutional credentials for the AI & Machine Learning Club, Oriental College of Technology (OCT), Bhopal.

The system is strictly **event-centric**, establishing a verifiable chain of custody:

```
Event
  ↓
Eligible Participant (Evaluated against Phase 3 Attendance)
  ↓
Certificate Batch (Idempotent worker processing)
  ↓
Draft & Pending Approval Gate
  ↓
Administrative Sign-off & Public Issuance
  ↓
Public Verification Surface (/verify/{id})
```

---

### 2. Eligibility Resolution Architecture

In accordance with Phase 3 Attendance operations and institutional standards:
- **Source of Truth**: Eligibility is dynamically evaluated by joining `event_participations` with `attendance_records` where `status IN ('PRESENT', 'CORRECTED')`.
- **Zero Attendance Duplication**: Attendance figures, check-in timestamps, and session counts are **never duplicated** into the certificate tables. The certificate record references the participant and event immutably.
- **Criteria Types**:
  - `PARTICIPATION`: Verified attendance meeting the event's minimum session threshold.
  - `MERIT` / `WINNER` / `RUNNER_UP`: Verified attendance combined with recorded competition scoring or organizer designation.
  - `VOLUNTEER`: Active assignment in `event_volunteers` with validated check-in history.
  - `ORGANIZER`: Executive club members / lead organizers.

---

### 3. Template Management & Versioning

To ensure historical credentials remain 100% reproducible and tamper-proof:
1. **Separation of Design and Data**: Canva is utilized externally for aesthetic design. Assets are stored on Google Drive as immutable templates (`google_drive_file_id`).
2. **Immutable Versioning**: When an administrator updates coordinates, typography, or template art, the system increments the template version and writes an immutable record to `certificate_template_versions`.
3. **No In-Place Overwrites**: Previously issued certificates permanently link to their specific `template_version_id`. Historical certificates can never be altered retroactively.

---

### 4. Bulk Generation & Worker Architecture

To avoid synchronous HTTP latency and timeouts during large event issuances:
1. **API Batch Initiation**: The administrative user selects the event, certificate type, and criteria, generating a `certificate_batches` record with status `DRAFT`.
2. **Worker Processing**: The standalone certificate worker (`workers/certificates/generator.py`) processes recipient batches asynchronously:
   - Calculates participant eligibility.
   - Generates unique collision-safe certificate identifiers (`AIML{YY}-{EVENT_SHORT}-{SERIAL:06d}`).
   - Derives SHA-256 cryptographic verification token hashes (`verification_token_hash`).
   - Renders vector/PDF assets embedding high-contrast QR codes pointing to `https://aimlcluboct.in/verify/{certificate_id}`.
   - Saves file metadata with Google Drive file identifiers.
3. **Failure Isolation**: Each participant generation is isolated. A rendering failure on one record increments `total_failed` without aborting the batch.
4. **Idempotency Guarantee**: Backed by a PostgreSQL unique composite index `(event_id, student_id, certificate_type)` preventing duplicate credentials.

---

### 5. Status Lifecycle & Approval Workflow

Certificates strictly adhere to a server-side state machine:

```
[DRAFT / GENERATING]
         ↓
 [PENDING_APPROVAL]
         ↓
     [APPROVED]
         ↓
      [ISSUED] (Publicly Verifiable)
      /      \
[REVOKED]   [REPLACED] (Linked to superseding issuance)
```

- **Issuance Gate**: Certificates in `DRAFT`, `GENERATING`, or `PENDING_APPROVAL` status are strictly invisible to public verification, returning `404 Not Found`.
- **Approval RBAC**: Only authorized roles (`CLUB_ADMIN`, `SUPER_ADMIN`, `CERTIFICATE_MANAGER`) may approve batches for issuance.
- **Revocation Protocol**: Requires an explicit administrative reason and timestamp (`revoked_at`, `revoke_reason`). Revoked certificates remain in the database for permanent audit integrity; the public verification surface renders an unambiguous dispute notice.
- **Replacement Protocol**: Old certificates are marked `REPLACED` and record `replaced_by`. The newly issued certificate displays normally while the historical URL transparently points to the superseding record.

---

### 6. Public Verification & Strict Privacy Boundary

Public verification is accessible at:
```
https://aimlcluboct.in/verify/{certificate-id}
```

In accordance with institutional privacy standards and `11_SECURITY_PRIVACY.md`, public verification responses **strictly omit private personal data**:
- **Publicly Visible**: Recipient Name, Event Title, Event Date, Certificate Type, Issue Date, Certificate Number, Verification Validity, Revocation/Replacement status.
- **Strictly Redacted**: Student Telephone Number, Personal Email, College Enrollment Number, Session Attendance Percentages, Biometric Embeddings, and Internal Database UUIDs.

---

### 7. Storage Architecture

- **Database**: PostgreSQL (Supabase) stores metadata, version references, token hashes, and audit logs.
- **Binary Assets**: Final vector and PDF certificate files are stored in institutional Google Drive folders referenced by immutable Drive File IDs. Local storage is strictly ephemeral.
