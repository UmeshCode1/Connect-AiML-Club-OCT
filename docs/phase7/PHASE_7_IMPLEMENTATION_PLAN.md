# AIML CLUB OCT — CONNECT
# Phase 7 — Knowledge & Innovation Showcase Implementation Plan
## Projects, Research, Learning Resources & Authorization-Aware Global Search

**Document Version**: 1.1.0  
**Status**: PHASE 7.0 ARCHITECTURE & FOUNDATION COMPLETE (PHASE 7.1 PENDING USER AUTHORIZATION)  
**Target Release**: `v1.6.0`  
**Base Release**: `v1.5.0` (Audited Commit `ef5f9f1`)  
**Production Supabase Reference**: `sslkenwxjqwwzcgafghm` (`Connect-AiML-Club-OCT`)  

---

## 1. Executive Summary & Objective

### 1.1. Strategic Purpose
Phase 7 elevates **AIML CLUB OCT — CONNECT** from an event operations and credentialing engine into a complete **Knowledge & Innovation Showcase**. The objective is to centralize, preserve, and publicly celebrate the applied artificial intelligence projects, research papers, workshop learning resources, and technical deliverables produced by the students and faculty of the AI & Machine Learning Club at Oriental College of Technology (OCT), Bhopal.

### 1.2. Core Problems Solved
1. **Scattered Student Innovation**: Student hackathon and workshop projects currently reside on personal GitHub repositories without institutional attribution, permanent showcase pages, or verified linkage to club events.
2. **Untracked Academic Research**: Student/faculty pre-prints, datasets, and research abstracts lack a centralized institutional archive and search directory.
3. **Fragmented Learning Materials**: Workshop Colab notebooks, slides, tutorial guides, and datasets are shared via transient messaging channels rather than indexed in a permanent, open educational resource catalog.
4. **Platform-Wide Discoverability**: As CONNECT has expanded to support Events, Attendance, Media, Certificates, Chronicle editions, and Journey milestones, users lack a unified, authorization-aware command palette (`Ctrl+K`) to discover resources instantly across all platform entities.

---

## 2. Scope Definition

### 2.1. In-Scope Modules
1. **Projects Module (`projects`, `project_members`)**:
   - Institutional project repository supporting markdown descriptions, technology stack tags, repository/demo/documentation links, cover media association, and event linkages.
   - Contributor attribution linking verified `student_profiles` to projects with defined roles (`LEAD`, `CONTRIBUTOR`, `MENTOR`, `ADVISOR`).
   - Project lifecycle states (`IDEA`, `IN_DEVELOPMENT`, `COMPLETED`, `ARCHIVED`).
   - Student project submission and editorial publishing workflow.
2. **Research Module (`research_items`)**:
   - Institutional research and pre-print catalog.
   - Structured author metadata, abstract, methodology summary, publication URLs, repository links, and dataset references.
   - Category classification (Computer Vision, NLP, Reinforcement Learning, Generative AI, Robotics, Data Science).
3. **Learning Resources Module (`learning_resources`)**:
   - Curated educational assets linked to canonical events (Notebooks, Slides, Recordings, Datasets, Tutorials).
   - Difficulty tiers (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`).
4. **Global Search Engine (`/v1/search` & `Ctrl+K` Command Palette)**:
   - Authorization-aware search across Events, Projects, Research, Learning, Chronicle, Journey, Team, and Certificates.
   - PostgreSQL trigram (`pg_trgm`) and weighted full-text search indexing.
   - Accessible keyboard-driven command palette modal on public and student web surfaces.

### 2.2. Out of Scope for Phase 7
- **Biometric Face Embedding Inference Worker**: The Phase 4 neural-network inference worker remains an independent mock/stub pending dedicated Azure GPU / ONNX runtime infrastructure. Phase 7 has zero dependency on face recognition inference.
- **Direct Video Streaming Transcoding**: Video moment key-frame extraction and video transcoding remain deferred to Phase 10 (Advanced Video).
- **Official WhatsApp Business API Integration**: Notification delivery via WhatsApp Business API remains in the integrations roadmap and is not blocking Phase 7.
- **Azure Storage Migration**: Google Drive immutable IDs remain the canonical cloud storage architecture for all media, document, and certificate assets.

---

## 3. Existing System Dependencies & Reuse Map

| Phase 7 Component | Existing Platform Dependency | Reuse Strategy |
|---|---|---|
| Project / Event Linkage | `events` table (Phase 2) | Foreign key `linked_event_id REFERENCES events(id)` |
| Cover Images | `media_assets` table (Phase 4) | Foreign key `cover_media_id REFERENCES media_assets(id)` |
| Project Contributors | `student_profiles` (Phase 1) | Junction `student_id REFERENCES student_profiles(id)` |
| Ownership & Publishing | `accounts` (Phase 1) | `created_by`, `published_by REFERENCES accounts(id)` |
| Authorization / RBAC | `team_roles`, `team_memberships` (Phase 1/6) | Use canonical security-definer `public.check_user_has_role(...)` |
| Safe External URLs | URL Scheme Validator (Phase 6.1 DEF-02) | Enforce `^https?://` regex across GitHub, Demo, Paper, Dataset URLs |
| Full-Text Search Engine | `pg_trgm` extension (Phase 1 Migration 000001) | Build GIN trigram indexes for high-speed sub-millisecond keyword search |
| Design Tokens & UI | `@connect/ui` & `@connect/config` | Direct reuse of institutional brand colors, typography, and card components |

---

## 4. Technical Debt Impact Assessment

| Technical Debt Item | Severity | Phase 7 Impact | Classification |
|---|---|---|---|
| **Phase 4 Biometric Neural Inference Worker** | Medium | None. Projects, research, and learning modules do not interact with face embeddings. | **NOT REQUIRED** |
| **Legacy `roles` / `user_roles` Tables** | Low | None. Verified empty, unused, and unreferenced by any active policy or service. | **NOT REQUIRED (Planned future drop)** |
| **Volunteer Unique Constraint** | None | Resolved in Migration `000008` (`uq_event_volunteer_session_role` verified live). | **RESOLVED** |
| **CI Ephemeral PostgreSQL Container** | Medium | Desirable for CI pull requests; local regression suites (100 backend tests) pass 100%. | **MEDIUM (Non-blocking)** |
| **URL Protocol Sanitization** | High | Critical for user-submitted GitHub/Demo links in projects. Must prevent `javascript:` XSS. | **HIGH (Enforce regex at Pydantic & UI layers)** |

---

## 5. Database Architecture & Proposed Schema (Migration 000009)

Phase 7 will introduce a single forward-only, idempotent migration: `20260925000009_projects_research_learning_search.sql`.

### 5.1. Conceptual Schema Definitions

#### 1. `projects` Table
```sql
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'IN_DEVELOPMENT', -- IDEA, IN_DEVELOPMENT, COMPLETED, ARCHIVED
  technology_stack TEXT[] NOT NULL DEFAULT '{}',
  repository_url TEXT,
  demo_url TEXT,
  documentation_url TEXT,
  cover_media_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
  linked_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  visibility TEXT NOT NULL DEFAULT 'PUBLIC', -- PUBLIC, AUTHENTICATED, TEAM_ONLY, HIDDEN
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_project_repo_url CHECK (repository_url IS NULL OR repository_url ~* '^https?://'),
  CONSTRAINT check_project_demo_url CHECK (demo_url IS NULL OR demo_url ~* '^https?://'),
  CONSTRAINT check_project_doc_url CHECK (documentation_url IS NULL OR documentation_url ~* '^https?://')
);

CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_status_vis ON projects(status, visibility);
CREATE INDEX IF NOT EXISTS idx_projects_linked_event ON projects(linked_event_id);
CREATE INDEX IF NOT EXISTS idx_projects_trgm ON projects USING gin (title gin_trgm_ops, summary gin_trgm_ops);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
```

#### 2. `project_members` Table
```sql
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE RESTRICT,
  role TEXT NOT NULL DEFAULT 'CONTRIBUTOR', -- LEAD, CONTRIBUTOR, MENTOR, ADVISOR
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_project_student UNIQUE (project_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_proj ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_student ON project_members(student_id);

ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
```

#### 3. `research_items` Table
```sql
CREATE TABLE IF NOT EXISTS research_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  abstract TEXT NOT NULL,
  authors JSONB NOT NULL DEFAULT '[]', -- [{ name, enrollment_number, affiliation, role }]
  category TEXT NOT NULL DEFAULT 'AI_ML', -- COMPUTER_VISION, NLP, REINFORCEMENT_LEARNING, GENERATIVE_AI, ROBOTICS, DATA_SCIENCE
  methodology TEXT,
  publication_url TEXT,
  repository_url TEXT,
  dataset_url TEXT,
  linked_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  linked_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  visibility TEXT NOT NULL DEFAULT 'PUBLIC', -- PUBLIC, AUTHENTICATED, HIDDEN
  status TEXT NOT NULL DEFAULT 'PUBLISHED', -- DRAFT, PUBLISHED, ARCHIVED
  created_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_research_pub_url CHECK (publication_url IS NULL OR publication_url ~* '^https?://'),
  CONSTRAINT check_research_repo_url CHECK (repository_url IS NULL OR repository_url ~* '^https?://'),
  CONSTRAINT check_research_dataset_url CHECK (dataset_url IS NULL OR dataset_url ~* '^https?://')
);

CREATE INDEX IF NOT EXISTS idx_research_slug ON research_items(slug);
CREATE INDEX IF NOT EXISTS idx_research_status_vis ON research_items(status, visibility);
CREATE INDEX IF NOT EXISTS idx_research_category ON research_items(category);
CREATE INDEX IF NOT EXISTS idx_research_trgm ON research_items USING gin (title gin_trgm_ops, abstract gin_trgm_ops);

ALTER TABLE research_items ENABLE ROW LEVEL SECURITY;
```

#### 4. `learning_resources` Table
```sql
CREATE TABLE IF NOT EXISTS learning_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  resource_type TEXT NOT NULL DEFAULT 'TUTORIAL', -- NOTEBOOK, TUTORIAL, WORKSHOP_MATERIAL, RECORDING, DATASET, SLIDES, DOCUMENTATION
  difficulty_level TEXT NOT NULL DEFAULT 'BEGINNER', -- BEGINNER, INTERMEDIATE, ADVANCED
  description TEXT,
  url TEXT NOT NULL,
  cover_media_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
  linked_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  visibility TEXT NOT NULL DEFAULT 'PUBLIC', -- PUBLIC, AUTHENTICATED, HIDDEN
  created_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_learning_url CHECK (url ~* '^https?://')
);

CREATE INDEX IF NOT EXISTS idx_learning_slug ON learning_resources(slug);
CREATE INDEX IF NOT EXISTS idx_learning_type_vis ON learning_resources(resource_type, visibility);
CREATE INDEX IF NOT EXISTS idx_learning_event ON learning_resources(linked_event_id);
CREATE INDEX IF NOT EXISTS idx_learning_trgm ON learning_resources USING gin (title gin_trgm_ops);

ALTER TABLE learning_resources ENABLE ROW LEVEL SECURITY;
```

### 5.2. Row-Level Security (RLS) Policies
- **`projects`**:
  - `Public can view published projects`: `visibility = 'PUBLIC' AND status IN ('IN_DEVELOPMENT', 'COMPLETED') AND (published_at IS NULL OR published_at <= NOW())`.
  - `Contributors can view own non-public projects`: Student is registered in `project_members`.
  - `Staff full access to projects`: `public.check_user_has_role('SUPER_ADMIN', 'CLUB_ADMIN', 'CONTENT_MANAGER')`.
- **`project_members`**:
  - `Public view project members`: Parent project is visible to public.
  - `Contributors view fellow members`: Contributor has membership on the project.
  - `Staff manage project members`: `public.check_user_has_role('SUPER_ADMIN', 'CLUB_ADMIN', 'CONTENT_MANAGER')`.
- **`research_items`**:
  - `Public view published research`: `visibility = 'PUBLIC' AND status = 'PUBLISHED'`.
  - `Staff full access to research`: `public.check_user_has_role('SUPER_ADMIN', 'CLUB_ADMIN', 'CONTENT_MANAGER')`.
- **`learning_resources`**:
  - `Public view published resources`: `visibility = 'PUBLIC'`.
  - `Staff full access to learning`: `public.check_user_has_role('SUPER_ADMIN', 'CLUB_ADMIN', 'CONTENT_MANAGER')`.

---

## 6. API Architecture (FastAPI Endpoints)

All endpoints conform to the canonical standard error envelope, Pydantic validation, and OpenAPI documentation at `/docs`.

### 6.1. Projects API (`/v1/projects`)
- `GET /v1/projects`: Public list of published projects with query filtering (`status`, `tag`, `event_id`, `featured`, `search`, `page`, `page_size`).
- `POST /v1/projects`: Submit a new project proposal (Requires authenticated student or staff; assigns submitting student as `LEAD`).
- `GET /v1/projects/{slug}`: Public retrieval of single project with hydrated contributor list and linked event details.
- `PATCH /v1/projects/{id}`: Update project details (Restricted to project `LEAD` or staff).
- `DELETE /v1/projects/{id}`: Archive project (Staff only).
- `POST /v1/projects/{id}/publish`: Review & publish project (Staff only).
- `POST /v1/projects/{id}/members`: Add verified contributor (Restricted to project `LEAD` or staff).
- `DELETE /v1/projects/{id}/members/{student_id}`: Remove contributor.

### 6.2. Research API (`/v1/research`)
- `GET /v1/research`: Public list of published research items with filtering by `category`, `event_id`, `search`, and pagination.
- `POST /v1/research`: Register research pre-print or paper (Authenticated author or staff).
- `GET /v1/research/{slug}`: Public retrieval of research paper abstract and external artifact links.
- `PATCH /v1/research/{id}`: Edit research item (Staff or author).
- `DELETE /v1/research/{id}`: Archive research item (Staff only).

### 6.3. Learning Resources API (`/v1/learning`)
- `GET /v1/learning`: Public catalog of resources filtered by `resource_type`, `difficulty_level`, `event_id`, and search keywords.
- `POST /v1/learning`: Register new workshop learning resource (Staff only).
- `GET /v1/learning/{slug}`: Public retrieval of resource detail.
- `PATCH /v1/learning/{id}`: Update learning resource (Staff only).
- `DELETE /v1/learning/{id}`: Remove learning resource (Staff only).

### 6.4. Unified Search API (`/v1/search`)
- `GET /v1/search?q={query}&type={type}&limit=20`:
  - `q`: Query string (minimum 2 characters).
  - `type`: Optional filter (`all`, `events`, `projects`, `research`, `learning`, `chronicle`, `journey`, `team`, `certificates`).
  - Authorization-Aware: Evaluates user JWT. If unauthenticated, only public resources are searched. If authenticated student, user's own private items (certificates, registrations) are included in dedicated result sections.
  - Performance: Uses composite PostgreSQL trigram indexes (`gin_trgm_ops`) for sub-20ms multi-entity queries.

---

## 7. Frontend Architecture & Design System Integration

### 7.1. Public Web Experience (`apps/web`)
1. **Projects Directory (`/projects`)**:
   - Filterable showcase grid utilizing semantic design tokens (`brandPrimary`, `darkSurface`, `nearBlack`).
   - Cards display status pills, tech tags, summary, cover image thumbnail, and team avatars.
2. **Project Detail View (`/projects/[slug]`)**:
   - Editorial layout with Hero header, problem/solution markdown sections, external link buttons (GitHub, Demo, Docs) with security sanitization.
   - Contributor roster with student verified badges and institutional course/batch tags.
   - Linked event card contextualizing when and where the project originated.
3. **Research Archive (`/research` & `/research/[slug]`)**:
   - Academic publication cards formatted with title, author badges, conference/publication venue, abstract snippet, and direct paper/dataset links.
4. **Learning Portal (`/learning` & `/learning/[slug]`)**:
   - Organized by format: Notebooks, Workshop Slides, Recordings, Datasets.
   - One-click launch in Google Colab / GitHub.
5. **Universal Command Palette (`Ctrl+K`)**:
   - Accessible modal rendered in root layout `<CommandPalette />`.
   - Real-time debounced search against `/v1/search`.
   - Keyboard navigable (<kbd>↑</kbd> <kbd>↓</kbd> <kbd>Enter</kbd> <kbd>Esc</kbd>).
   - Results grouped by domain (Events, Projects, Chronicle, Research, Resources).

### 7.2. Admin Management Interfaces (`apps/admin`)
1. **Projects Manager (`/projects`)**:
   - Data table displaying all submitted projects across statuses (`IDEA`, `IN_DEVELOPMENT`, `COMPLETED`, `ARCHIVED`).
   - Review and publication approval workflow with feedback notes.
   - Member attribution editor.
2. **Research Manager (`/research`)**:
   - Registry for papers, publications, and author metadata.
3. **Learning Resources Manager (`/learning`)**:
   - Resource link management, type classification, event association.

---

## 8. Security & Threat Modeling

1. **Dangerous URL Schemes (XSS Prevention)**:
   - *Threat*: Malicious student injects `javascript:...` or `data:...` into `repository_url`, `demo_url`, or `publication_url`.
   - *Control*: Strict Pydantic validation regex `^https?://` on backend; Next.js anchor sanitizer with `rel="noopener noreferrer"`.
2. **IDOR & Unauthorized Project Tampering**:
   - *Threat*: Student modifies a project they do not own.
   - *Control*: Service layer and RLS verify that student ID is listed in `project_members` with role `LEAD` or actor possesses `CONTENT_MANAGER` / `CLUB_ADMIN` RBAC.
3. **Information Disclosure in Global Search**:
   - *Threat*: Search query exposes private student email addresses, hidden projects, or unmoderated feedback.
   - *Control*: Search service strictly queries public-safe projection views; private student directory search is restricted to authenticated staff with `participants.view` permission.
4. **Denial of Service via Heavy Wildcard Search**:
   - *Threat*: Attacker sends expensive `%` wildcard queries across multiple tables.
   - *Control*: Trigram search pinned to pre-indexed GIN columns; rate limiting enforced at FastAPI gateway; minimum query length enforced (≥ 2 characters).

---

## 9. Testing & Quality Assurance Strategy

1. **Unit & Domain Tests (`apps/api/tests/`)**:
   - Project lifecycle transitions (`IDEA` → `IN_DEVELOPMENT` → `COMPLETED`).
   - Project member role authorization (`LEAD` vs `CONTRIBUTOR`).
   - Research item creation and JSONB author schema validation.
   - Learning resource link scheme validation and duplicate slug prevention.
   - Global search authorization filtering and ranking.
2. **TypeScript & Static Analysis**:
   - Full monorepo typecheck (`tsc --noEmit` across all 5 workspaces).
   - Shared type definitions in `@connect/types/src/index.ts`.
3. **Production Next.js Builds**:
   - Static pre-rendering verification for `/projects`, `/research`, `/learning`.
   - Dynamic server-rendered route verification for slug detail pages.
4. **Automated Regression**:
   - Zero regression across all 100 existing backend tests covering Events, Attendance, Media, Certificates, Chronicle, Journey, and Feedback.

---

## 10. Phased Implementation Roadmap (Phase 7 Breakdown)

```text
Phase 7.0 — Architecture, Types & Database Foundation (Migration 000009)
Phase 7.1 — Backend Services & API Layer (Projects, Research, Learning, Search)
Phase 7.2 — Admin Management Workflows (@connect/admin)
Phase 7.3 — Public Showcase, Student Submission & Command Palette (@connect/web)
Phase 7.4 — Comprehensive Security Audit, Testing & Production Deployment Gate
```

### Milestone Deliverables

#### Milestone 7.0: Schema & Foundation — COMPLETED (Commit: Phase 7.0 Gate)
- **Database Migration 000009**: Author forward-only, idempotent migration `supabase/migrations/20260925000009_projects_research_learning_search.sql`.
  - Tables: `projects`, `project_members`, `research_items`, `learning_resources`.
  - Constraints: Status/visibility enums, unique slugs, member composite unique constraint `(project_id, student_id)`, HTTP(S) URL scheme check constraints.
  - Search Foundation: Native PostgreSQL `pg_trgm` extension and GIN trigram indexes (`idx_projects_trgm`, `idx_research_trgm`, `idx_learning_trgm`).
  - Row-Level Security: Enabled across all 4 tables; public select restricted to published/public items; project LEAD update policies; staff management via canonical `public.check_user_has_role('SUPER_ADMIN', 'CLUB_ADMIN', 'CONTENT_MANAGER')`.
  - Clean Architecture: Historical migrations `000001`–`000008` unchanged; no `user_roles` or deprecated role tables referenced.
- **Shared Domain Types**: Updated `packages/types/src/index.ts` with canonical interfaces (`Project`, `ProjectMember`, `ResearchItem`, `LearningResource`) and payload types.
- **Pydantic Foundation Schemas**: Implemented `apps/api/src/schemas/knowledge.py` with strict URL scheme sanitization (rejecting `javascript:`, `data:`, `vbscript:`, etc.) and exported in `apps/api/src/schemas/__init__.py`.
- **Automated Verification Suite**: Authored `apps/api/tests/test_knowledge_foundation.py` (14/14 tests passing).
- **Validation Gate Results**:
  - Full Backend Pytest Suite: 114/114 passing (100% pass rate, 0 regressions).
  - TypeScript Typecheck: 0 errors across all 5 monorepo workspaces.
  - `@connect/admin` Next.js Production Build: PASS (Exit code 0).
  - `@connect/web` Next.js Production Build: PASS (Exit code 0).

#### Milestone 7.1: Backend Domain Services & Endpoints — PENDING AUTHORIZATION
- Implement `apps/api/src/services/project_service.py`.
- Implement `apps/api/src/services/research_service.py`.
- Implement `apps/api/src/services/learning_service.py`.
- Implement `apps/api/src/services/search_service.py`.
- Mount endpoints under `/v1/projects`, `/v1/research`, `/v1/learning`, `/v1/search`.
- Author comprehensive Pytest test suite in `apps/api/tests/test_projects_research_learning.py`.

#### Milestone 7.2: Admin Experience — PLANNED
- Build `/projects`, `/research`, `/learning` management interfaces in `@connect/admin`.
- Enable editorial review, status updates, and member management.

#### Milestone 7.3: Public Showcase & Student Experience — PLANNED
- Build `/projects`, `/projects/[slug]` with responsive grid and contributor cards.
- Build `/research`, `/research/[slug]` academic publication index.
- Build `/learning`, `/learning/[slug]` open educational resource portal.
- Implement root layout `<CommandPalette />` (`Ctrl+K`) with authorization-aware search.

#### Milestone 7.4: Verification & Production Release Gate — PLANNED
- Execute 100% green test suite.
- Deploy migration `000009` to Supabase production (`sslkenwxjqwwzcgafghm`).
- Verify live constraints, RLS policies, and SEO metadata.
- Compile Post-Release Audit Report and release `v1.6.0`.

---

## 11. Blocker & Pre-Condition Matrix

| Dependency | Status | Required Action Before Phase 7 Coding |
|---|---|---|
| Production Database Status | **READY** | Migration `000008` applied and verified. Zero blockers remain. |
| Production Project Ref | **CONFIRMED** | `sslkenwxjqwwzcgafghm` (`Connect-AiML-Club-OCT`). |
| Canonical RBAC | **CONFIRMED** | Canonical `check_user_has_role(...)` active and available. |
| Phase 7.0 Foundation | **COMPLETE** | Migration 000009, types, Pydantic schemas, and 14 foundation tests verified. |
| Phase 7.1 Implementation Authorization | **PENDING** | **Strict Stop**: Await formal user instruction and approval to begin Phase 7.1 execution. |

---

## 12. Definition of Done for Phase 7

1. All 4 Phase 7 entities (`projects`, `project_members`, `research_items`, `learning_resources`) are created via forward-only migration `000009` with RLS enabled.
2. Canonical RBAC functions control all administrative and editorial actions.
3. Fast trigram GIN indexes support sub-millisecond search across all knowledge assets.
4. All external links strictly reject non-HTTP(S) pseudo-protocols (`javascript:`, `data:`).
5. All backend unit and integration tests pass with 100% coverage of new endpoints.
6. TypeScript typecheck passes with 0 errors across all 5 monorepo workspaces.
7. `@connect/admin` and `@connect/web` production builds pass.
8. Live production Supabase database deployment is independently verified without data loss.
9. Documentation in `docs/` is updated and synchronized.
