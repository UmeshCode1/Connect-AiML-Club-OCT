# AIML CLUB OCT — CONNECT
## Phase 6.1 Architecture: Chronicle Editorial Engine

Version: 1.5.0  
Date: 2026-09-25  
Status: Implemented & Validated

---

### 1. Architectural Overview

Chronicle is the official publication and digital magazine system for AIML CLUB OCT. It provides a structured, multi-tier editorial lifecycle for publishing:
- Weekly student highlights
- Monthly executive digests
- Event recaps and symposium proceedings
- Technical and research digests
- Institutional announcements

The architecture bridges the editorial domain with the canonical Event and Media layers without duplicating binary assets or core event records.

```
DRAFT
  ↓ (Submit for Review: Content Manager / Staff)
REVIEW
  ↓ (Editorial Approval & Scheduling: Content Manager / Club Admin)
SCHEDULED / APPROVED
  ↓ (Publication Dispatch: Content Manager / Club Admin / Super Admin)
PUBLISHED
  ↓ (Archive / Sunset)
ARCHIVED
```

---

### 2. Domain Data Model & Foreign Key Architecture

Chronicle is modeled across two relational tables:

1. **`chronicle_entries`**:
   - `id`: UUID Primary Key
   - `title`: String (2–255 chars)
   - `slug`: Unique URL-safe identifier (e.g., `welcome-to-aiml-club-chronicle-2026`)
   - `edition_type`: Enum (`WEEKLY_UPDATE`, `MONTHLY_DIGEST`, `EVENT_RECAP`, `RESEARCH_DIGEST`, `COMMUNITY_UPDATE`, `INSTITUTIONAL_ANNOUNCEMENT`)
   - `excerpt`: Text summary for meta descriptions and listing preview cards
   - `content`: Markdown / sanitized structural content
   - `cover_media_id`: Foreign Key referencing canonical `media_assets(id)` (No binary media duplication in PostgreSQL)
   - `visibility`: Enum (`PUBLIC`, `MEMBERS_ONLY`, `INTERNAL`)
   - `status`: Enum (`DRAFT`, `REVIEW`, `SCHEDULED`, `PUBLISHED`, `ARCHIVED`)
   - `scheduled_at`: Optional future publication timestamp
   - `published_at`: Explicit release timestamp
   - `created_by`: Foreign Key referencing `accounts(id)`
   - `approved_by`: Foreign Key referencing `accounts(id)`
   - `seo_title`, `seo_description`: Open Graph and search engine metadata

2. **`event_chronicle_items`**:
   - `id`: UUID Primary Key
   - `chronicle_id`: Foreign Key referencing `chronicle_entries(id)` ON DELETE CASCADE
   - `event_id`: Foreign Key referencing canonical `events(id)` ON DELETE CASCADE
   - `display_order`: Integer sorting index
   - Unique Constraint: `(chronicle_id, event_id)`

---

### 3. Canonical Event & Media Integration

- **Event References**: Chronicle entries do not duplicate event titles, dates, or venues. When an article covers or recaps an event, a join record in `event_chronicle_items` references the canonical event `id`. Public readers navigate to canonical event URLs (`/events/[slug]`).
- **Media Asset References**: Editorial banners and embedded images reference existing `media_assets` rows, keeping Google Drive as the immutable large binary archive while Supabase stores structured metadata.

---

### 4. Content Security & Privacy Boundaries

- **Draft Isolation**: Any entry where `status != 'PUBLISHED'` or `visibility != 'PUBLIC'` returns `404 Not Found` to public or unauthenticated callers. Drafts, reviews, and private articles are never leaked through public APIs, static site generation, sitemaps, or Open Graph tags.
- **Sanitized Rendering**: Rich markdown is rendered through safe text containers to prevent XSS or arbitrary script injection.
- **Role-Based Access Control**:
  - `chronicle.create`, `chronicle.update`: Held by `CONTENT_MANAGER`, `CLUB_ADMIN`, and `SUPER_ADMIN`.
  - `chronicle.approve`: Held by `CONTENT_MANAGER`, `CLUB_ADMIN`, and `SUPER_ADMIN`.
  - `chronicle.publish`: Held by `CONTENT_MANAGER`, `CLUB_ADMIN`, and `SUPER_ADMIN`.
  - Viewers, Volunteers, Event Managers, and Media Managers are strictly denied editorial mutations.
