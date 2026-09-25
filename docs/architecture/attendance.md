# AIML CLUB OCT — CONNECT
## Architecture Specification: Attendance, Session Operations & Volunteer Workflows (Phase 3)

### 1. Overview & Objectives
Phase 3 establishes an authoritative, cryptographically signed, multi-session attendance tracking and volunteer operations system for club events. It replaces manual paper sign-ins with an anti-tamper, tamper-evident digital workflow while upholding student data privacy and strict event-scoped role delegation.

---

### 2. Multi-Session Model
Each event can host multiple distinct sessions (e.g. Morning Keynote, Hands-on Workshop, Code Sprint, Valedictory Ceremony).
- **Session Entity (`event_sessions`)**:
  - Bound strictly to a parent `event_id`.
  - Maintains `session_order`, `start_at`, `end_at`, and `status` (`SCHEDULED`, `ACTIVE`, `COMPLETED`, `CANCELLED`).
  - Attendance check-in is scoped to a specific `session_id`, enabling granular tracking across multi-day or multi-track events.

---

### 3. Cryptographic QR Verification & Anti-Replay
1. **QR Token Composition**:
   - The QR code contains an HMAC-SHA256 signed compact token: `ACT-2026-{STUDENT_ID}-{HEX_HMAC}`.
   - The signature is calculated over `student_id:event_id:expires_at:secret_key`.
   - Never exposes raw student contact data, phone numbers, or emails within the QR payload.
2. **Server-Side Timestamping**:
   - Check-in and check-out timestamps are strictly generated on the server using UTC `datetime.now(timezone.utc)`. Client-provided timestamps are rejected.
3. **Duplicate Prevention**:
   - The database enforces a unique composite constraint on `(session_id, student_id)`.
   - Subsequent check-in attempts for the same session return an HTTP 409 Conflict with duplicate status.
4. **Checkout Enforcement**:
   - Check-out requests verify an existing check-in record and ensure that `checked_out_at >= checked_in_at`.

---

### 4. Manual Attendance Correction Workflow
When an exception occurs (e.g., student phone battery depleted, emergency exit), authorized personnel can perform a manual correction.
- **Mandatory Justification**: Every correction requires a non-empty `reason` field explaining the administrative intervention.
- **Immutable Audit Trail**:
  - The correction updates the attendance record status (`CORRECTED`, `EXCUSED`, `MANUALLY_VERIFIED`).
  - An audit trail entry records `previous_status`, `new_status`, `reason`, `updated_by` admin identity, and `updated_at` timestamp.

---

### 5. Volunteer RBAC & Least-Privilege Scope
Volunteers are granted temporary, event-scoped operational privileges without exposing broader administrative access.
- **Roles**:
  - `REGISTRATION_DESK`: Verifies student identity and checks in attendees.
  - `ATTENDANCE`: Scans session QR passes and operates session check-in/out.
  - `EVENT_MANAGER`: Oversees session scheduling, manual corrections, and roster export.
- **Scope Restriction**:
  - Volunteers cannot modify event core configuration, delete events, or alter system-wide settings.
  - Assignments can be revoked instantly by `SUPER_ADMIN` or `CLUB_ADMIN`.
