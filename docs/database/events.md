# AIML CLUB OCT — CONNECT
## Database Specification — Event & Participation Schema

Version: 1.1  
Engine: PostgreSQL 15+ (Supabase)

---

### 1. Events Table (`events`)

```sql
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_code TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  short_description TEXT,
  description TEXT,
  event_type TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  visibility TEXT NOT NULL DEFAULT 'PUBLIC',
  cover_media_id UUID,
  venue TEXT,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  registration_open_at TIMESTAMPTZ,
  registration_close_at TIMESTAMPTZ,
  capacity INTEGER,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES accounts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT events_date_check CHECK (start_at IS NULL OR end_at IS NULL OR start_at <= end_at),
  CONSTRAINT events_registration_date_check CHECK (registration_open_at IS NULL OR registration_close_at IS NULL OR registration_open_at <= registration_close_at),
  CONSTRAINT events_capacity_check CHECK (capacity IS NULL OR capacity >= 0)
);
```

---

### 2. Event Participations Table (`event_participations`)

```sql
CREATE TABLE IF NOT EXISTS event_participations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE RESTRICT,
  registration_source TEXT,
  source_record_id TEXT,
  registration_status TEXT NOT NULL DEFAULT 'REGISTERED',
  event_role TEXT,
  team_name TEXT,
  result TEXT,
  notes TEXT,
  registered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, student_id)
);
```

---

### 3. Row-Level Security (RLS) Policies

1. **Public Read Policy (`events`)**:
   - `SELECT USING (visibility = 'PUBLIC' AND status NOT IN ('DRAFT', 'ARCHIVED'))`
2. **Staff Full Access Policy (`events`)**:
   - `ALL USING (roles: SUPER_ADMIN, CLUB_ADMIN, EVENT_MANAGER)`
3. **Student Read Own Policy (`event_participations`)**:
   - `SELECT USING (auth.uid() = student account mapping)`
4. **Staff Roster Management Policy (`event_participations`)**:
   - `ALL USING (roles: SUPER_ADMIN, CLUB_ADMIN, EVENT_MANAGER)`
