# AIML CLUB OCT — CONNECT
## Database Specification: Attendance & Session Operations (Phase 3)

### Schema Details: `20260925000003_attendance_operations.sql`

#### 1. `event_sessions` Table
Stores chronological session divisions within a given club event.
- `id` (UUID, Primary Key, default `gen_random_uuid()`)
- `event_id` (UUID, Foreign Key referencing `events(id)` ON DELETE CASCADE)
- `session_order` (INTEGER, NOT NULL)
- `title` (VARCHAR(255), NOT NULL)
- `description` (TEXT)
- `room` (VARCHAR(100))
- `start_at` (TIMESTAMPTZ, NOT NULL)
- `end_at` (TIMESTAMPTZ, NOT NULL)
- `status` (VARCHAR(30), default `'SCHEDULED'`)
- `created_at` / `updated_at` (TIMESTAMPTZ)

#### 2. `attendance_records` Enhancements
- Scoped to both `event_id` and `session_id`.
- Unique constraint: `UNIQUE (session_id, student_id)`.
- `checked_in_at` (TIMESTAMPTZ, NOT NULL, server-side recorded).
- `checked_out_at` (TIMESTAMPTZ, NULLABLE).
- `source` (`QR_SCAN`, `MANUAL_DESK`, `ADMIN_OVERRIDE`).
- `status` (`CHECKED_IN`, `CHECKED_OUT`, `CORRECTED`, `EXCUSED`).
- `recorded_by` (UUID, referencing user ID of scanner/volunteer).
- `correction_reason` (TEXT, required on status modifications).
- `updated_by` (UUID, administrator who performed manual correction).

#### 3. `volunteer_assignments` Table
Enforces event-scoped volunteer roles and assignments.
- `id` (UUID, Primary Key)
- `event_id` (UUID, Foreign Key referencing `events(id)` ON DELETE CASCADE)
- `user_id` (UUID, Foreign Key referencing `users(id)` ON DELETE CASCADE)
- `role` (VARCHAR(50), e.g. `'ATTENDANCE'`, `'REGISTRATION_DESK'`)
- `assigned_by` (UUID, Foreign Key referencing `users(id)`)
- `assigned_at` (TIMESTAMPTZ)
- `status` (`ACTIVE`, `REVOKED`)
- Unique constraint: `UNIQUE (event_id, user_id)`

#### 4. Row-Level Security (RLS)
- Public / students can view active session details and their personal attendance records.
- Event volunteers (`ATTENDANCE`, `REGISTRATION_DESK`) can insert check-in records for assigned events.
- Administrative roles (`SUPER_ADMIN`, `CLUB_ADMIN`, `EVENT_MANAGER`) retain full read, write, and correction rights.
