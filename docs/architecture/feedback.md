# AIML CLUB OCT — CONNECT
## Phase 6.1 Architecture: Event Feedback & Testimonial Moderation Engine

Version: 1.5.0  
Date: 2026-09-25  
Status: Implemented & Validated

---

### 1. Architectural Overview

The Feedback engine captures post-event evaluations, attendee satisfaction scores, and qualitative suggestions directly linked to canonical `events`. It enforces strict privacy controls, prevents spam and duplicate submissions, and provides a moderation workflow for curating public student testimonials.

---

### 2. Domain Data Model & Privacy Schema

The `feedback` table enforces integrity and privacy at the schema level:

```sql
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE RESTRICT,
  participation_id UUID REFERENCES event_participations(id) ON DELETE SET NULL,
  source TEXT DEFAULT 'PORTAL', -- PORTAL, PWA, TALLY, MANUAL
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT NOT NULL,
  suggestion_text TEXT,
  publication_consent TEXT NOT NULL DEFAULT 'NO', -- NO, ANONYMOUS, PUBLIC_NAME
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  moderation_status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
  visibility TEXT NOT NULL DEFAULT 'ADMIN_ONLY', -- ADMIN_ONLY, PUBLIC
  moderated_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,
  moderation_notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_event_student_feedback UNIQUE (event_id, student_id)
);
```

---

### 3. Privacy, Consent & Attribution Model

Student privacy is protected by design across all data layers:

1. **Submission Consent Options**:
   - `NO`: Strict private feedback. The submission is visible **only** to authorized staff (`EVENT_MANAGER`, `CONTENT_MANAGER`, `CLUB_ADMIN`). It can **never** be published on public pages.
   - `ANONYMOUS`: Public showcase is permitted, but the author is permanently masked as **"Anonymous Participant"**. Student UUID, email, enrollment number, and phone number are stripped before rendering.
   - `PUBLIC_NAME`: The student grants explicit permission to show their verified name (e.g., "Aarav Sharma") alongside their testimonial. Student contact information (email, phone, enrollment number) is **strictly redacted** from public serialization.

2. **Database Integrity & Duplicate Prevention**:
   - `CONSTRAINT uq_event_student_feedback UNIQUE (event_id, student_id)` guarantees each participant can submit only one feedback evaluation per event.
   - Internal linking to `student_id` is retained for anti-abuse and duplicate enforcement, but public APIs use projection models (`PublicFeedbackResponse`) that omit internal identifiers entirely.

3. **Moderation Workflow**:
   - Every submission initializes with `moderation_status = 'PENDING'` and `visibility = 'ADMIN_ONLY'`.
   - Content Managers or Club Admins review entries in the Event Moderation Hub.
   - Only entries marked `APPROVED` with consent in (`ANONYMOUS`, `PUBLIC_NAME`) appear on public event pages.

---

### 4. RBAC Permissions Matrix

- `feedback.submit`: Any verified student / attendee registered for the event.
- `feedback.view`: `EVENT_MANAGER`, `CONTENT_MANAGER`, `CLUB_ADMIN`, `SUPER_ADMIN`.
- `feedback.publish`: `CONTENT_MANAGER`, `CLUB_ADMIN`, `SUPER_ADMIN`.
- Unauthenticated / anonymous visitors: Read-only access to approved public feedback through `/v1/events/{event_id}/feedback`.
