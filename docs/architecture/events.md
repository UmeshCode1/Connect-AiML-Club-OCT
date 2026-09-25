# AIML CLUB OCT — CONNECT
## Event Domain Architecture Specification

Version: 1.1  
Status: Phase 2 Implemented  
Last Updated: 2026-09-25

---

### 1. Architectural Philosophy

The **Event** is the central operational and historical aggregate of the AIML Club OCT platform. Rather than treating events as static blog posts or calendar entries, Connect models the full operational reality of college club activities.

An Event aggregates:
- **Participants**: Individual students registered through public PWA or external intake.
- **Capacity**: Maximum venue/resource limits with automated overflow waitlisting.
- **Lifecycle**: Finite state machine transitions preventing invalid operational changes.
- **Attendance**: Event-scoped check-in/check-out logs (Phase 3).
- **Media**: Photos and videos linked to the event via Google Drive storage IDs (Phase 4).
- **Credentials**: Verifiable certificates issued to eligible participants (Phase 5).

---

### 2. Canonical Event Lifecycle

In accordance with `01_PRODUCT_REQUIREMENTS.md` (Section 7), event progression is governed by a strict finite state machine:

```text
       ┌───────────┐
       │   DRAFT   │
       └─────┬─────┘
             │
             ▼
       ┌───────────┐
       │ PLANNING  │
       └─────┬─────┘
             │
             ▼
┌─────────────────────────┐
│    REGISTRATION_OPEN    │◄──────────┐
└────────────┬────────────┘           │
             │                        │
             ▼                        │
┌─────────────────────────┐           │
│   REGISTRATION_CLOSED   │───────────┘
└────────────┬────────────┘
             │
             ▼
       ┌───────────┐
       │   LIVE    │
       └─────┬─────┘
             │
             ▼
       ┌───────────┐
       │ COMPLETED │
       └─────┬─────┘
             │
             ▼
┌─────────────────────────┐
│    MEDIA_PROCESSING     │
└────────────┬────────────┘
             │
             ▼
       ┌───────────┐
       │CERTIFICATES│
       └─────┬─────┘
             │
             ▼
       ┌───────────┐
       │ ARCHIVED  │ (Terminal)
       └───────────┘
```

#### Valid Transitions:
- `DRAFT`: Can move to `PLANNING` or `ARCHIVED`.
- `PLANNING`: Can move to `REGISTRATION_OPEN`, `DRAFT`, or `ARCHIVED`.
- `REGISTRATION_OPEN`: Can move to `REGISTRATION_CLOSED`, `LIVE`, or `ARCHIVED`.
- `REGISTRATION_CLOSED`: Can reopen to `REGISTRATION_OPEN`, move to `LIVE`, or `ARCHIVED`.
- `LIVE`: Can move to `COMPLETED` or `ARCHIVED`.
- `COMPLETED`: Can move to `MEDIA_PROCESSING`, `CERTIFICATES`, or `ARCHIVED`.
- `MEDIA_PROCESSING`: Can move to `CERTIFICATES`, `COMPLETED`, or `ARCHIVED`.
- `CERTIFICATES`: Can move to `ARCHIVED` or `COMPLETED`.
- `ARCHIVED`: Terminal state. Only `SUPER_ADMIN` can restore to `DRAFT`.

---

### 3. Registration & Capacity Engine

The registration engine explicitly decouples the student profile from event participation:

1. **Window Verification**:
   - Registrations are accepted only when status is `REGISTRATION_OPEN`.
   - If `registration_close_at` has elapsed, registration is rejected with `400 BAD_REQUEST`.
2. **Duplicate Prevention**:
   - Unique constraint on `(event_id, student_id)`.
   - API verifies deduplication across normalized `enrollment_number` and `email`.
   - Duplicate attempts return `409 CONFLICT`.
3. **Capacity & Waitlist Allocation**:
   - When active registrations reach configured `capacity`, new registrations receive `WAITLISTED` status.
   - When a confirmed registration is cancelled, waitlisted candidates become eligible for promotion.
4. **Registration Statuses**:
   - `REGISTERED`
   - `CONFIRMED`
   - `WAITLISTED`
   - `CANCELLED`
   - `REJECTED`
   - `WALK_IN`
   - `ATTENDED`

---

### 4. Integration Boundaries (Tally & Google Sheets)

Per Phase 2 requirements, the intake boundary is prepared without fake sync:
- **Tally**: External web form submissions parsed into `TallyWebhookPayload`.
- **Google Sheets**: Spreadsheet intake parsed into `SheetRowRecord`.
- **Pre-commit Validation**: Standardizes student full name, normalizes institutional enrollment format (e.g. `0126AL221001`), validates email format before committing to PostgreSQL.
