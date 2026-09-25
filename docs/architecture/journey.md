# AIML CLUB OCT — CONNECT
## Phase 6.1 Architecture: Journey Institutional Timeline

Version: 1.5.0  
Date: 2026-09-25  
Status: Implemented & Validated

---

### 1. Architectural Overview

The Journey module represents the institutional memory and historical timeline of AIML CLUB OCT. It chronicles foundational milestones, symposium launches, national/state competition victories, research partnerships, and leadership transitions.

**Core Principle**: Journey is **NOT a second event database**.
- When a milestone relates to a past symposium or workshop, it immutably links to the canonical `events(id)`.
- When a milestone features an archival photograph, it links to `media_assets(id)`.
- Canonical entity attributes (event venue, date, registrations, media binaries) remain authoritative in their primary tables.

---

### 2. Domain Data Model

Journey milestones are managed in the `journey_milestones` table:

- `id`: UUID Primary Key
- `title`: String (2–255 chars)
- `slug`: Unique URL-safe slug (e.g. `foundation-of-aiml-club-oct`)
- `milestone_date`: Date (YYYY-MM-DD)
- `milestone_type`: Enum (`FOUNDATION`, `EVENT`, `ACHIEVEMENT`, `PARTNERSHIP`, `LEADERSHIP`, `RESEARCH`, `COLLABORATION`, `OTHER`)
- `description`: Comprehensive historical narrative
- `cover_media_id`: Foreign Key referencing `media_assets(id)` ON DELETE SET NULL
- `linked_event_id`: Foreign Key referencing canonical `events(id)` ON DELETE SET NULL
- `linked_project_id`: Optional project foreign reference
- `external_link`: Validated URL for press releases, institutional circulars, or partner websites
- `visibility`: Enum (`PUBLIC`, `MEMBERS_ONLY`, `INTERNAL`)
- `status`: Enum (`DRAFT`, `PUBLISHED`, `ARCHIVED`)
- `display_order`: Secondary sorting order for milestones sharing the same date
- `published_at`: Timestamp of public release
- `created_by`: Foreign Key referencing `accounts(id)`
- `created_at`, `updated_at`: Standard audit timestamps

---

### 3. Timeline Sequence & Query Performance

- **Chronological Index**: An index `idx_journey_date ON journey_milestones(milestone_date DESC, display_order ASC)` guarantees fast timeline retrieval without in-memory full-table scans.
- **Privacy Filtering**: Public queries filter on `status = 'PUBLISHED' AND visibility = 'PUBLIC'`. Unpublished historical drafts are inaccessible to public callers.

---

### 4. RBAC & Administrative Governance

- `journey.*`: Governed by `CONTENT_MANAGER`, `CLUB_ADMIN`, and `SUPER_ADMIN`.
- Published milestones undergo audit logging (`JOURNEY_MILESTONE_CREATED`, `JOURNEY_MILESTONE_UPDATED`, `JOURNEY_MILESTONE_PUBLISHED`, `JOURNEY_MILESTONE_ARCHIVED`).
- Historical integrity is preserved: edits require explicit privileges and preserve audit logs in `audit_logs`.
