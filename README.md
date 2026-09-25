# AIML CLUB OCT — CONNECT
> **“Innovate. Implement. Inspire.”**

Official unified operational and student-facing platform for the **AI & Machine Learning Club**, Oriental College of Technology (OCT), Bhopal.

---

## 1. Product Overview

Connect is a modular platform engineered to extend the existing digital presence of AIML Club OCT. It coordinates events, participants, attendance, media archives, verified digital certificates, club chronicle, community legacy, and student projects.

### Domain Layout
- **`https://aimlcluboct.in`**: Existing official public website (remains intact and uninterrupted).
- **`https://app.aimlcluboct.in`**: Connect student, member, and participant portal (PWA).
- **`https://admin.aimlcluboct.in`**: Administrative management dashboard.
- **`https://api.aimlcluboct.in`**: Unified backend API.
- **Existing Subdomains**: `voice.aimlcluboct.in` and `social.aimlcluboct.in` remain active.

---

## 2. Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Pure CSS Tokens (WCAG 2.2 AA compliant).
- **Backend**: FastAPI (Python 3.12+), Pydantic v2, RESTful OpenAPI `/v1`.
- **Database**: Supabase PostgreSQL with `pgvector`, `pg_trgm`, `uuid-ossp`, and Row-Level Security (RLS).
- **Storage**: Google Drive (managed via immutable file/folder IDs).
- **Operational Integrations**: Tally Forms, Google Sheets, Transactional Email.
- **CI/CD**: GitHub Actions (`.github/workflows/ci.yml`).

---

## 3. Monorepo Structure

```text
apps/
  web/          # Next.js frontend (app.aimlcluboct.in)
  admin/        # Next.js admin interface (admin.aimlcluboct.in)
  api/          # FastAPI backend (api.aimlcluboct.in)

packages/
  assets/       # Official branding assets (emblem, logos, icons)
  config/       # Shared design tokens and domain constants
  types/        # Canonical TypeScript domain models
  ui/           # Reusable accessible components & tokens.css

supabase/
  migrations/   # Versioned PostgreSQL DDL & RLS policies
  seed/         # Default RBAC roles and permissions seed data

workers/
  certificates/ # Verified credentials generation engine
  face-search/  # Consented student photo discovery worker
  media/        # Event photo/video processing worker
  sync/         # Tally & Google Sheets synchronization worker

docs/
  architecture/ # System architecture documentation
  database/     # Schema and entity relationship documentation
  api/          # REST API contracts and envelope documentation
  security/     # Privacy and RBAC specifications
  deployment/   # Environments and routing documentation
  development/  # Local developer setup guide
  integrations/ # External tools integration specs
  specifications/# Master specifications (01 to 17)
  REPOSITORY_AUDIT.md # Master repository audit

.github/
  workflows/    # CI pipeline definition
```

---

## 4. Current Status: Foundation Initialized

In accordance with **`17_DEVELOPMENT_ROADMAP.md`**, this repository is in the **Engineering Foundation** phase:
- Repository structure established.
- Master specifications (01–17) analyzed and documented.
- Official branding assets organized.
- Monorepo packages (`@connect/types`, `@connect/config`, `@connect/ui`) configured.
- FastAPI backend entry point, routers, health probes, and test suite active.
- Supabase relational schema migrations and seed scripts authored.
- `AGENTS.md` persistent instructions established.
- Automated CI pipeline configured.

**No advanced application modules (Events CRUD, Face Matching, Certificate Generation, Bulk Sync) have been prematurely built ahead of approval.**

---

## 5. Getting Started

### Prerequisites
- Node.js 18+ & npm
- Python 3.11+

### Local Setup
```bash
# 1. Clone and configure environment
cp .env.example .env

# 2. Install Node dependencies
npm.cmd install

# 3. Install Python dependencies
python -m pip install -r apps/api/requirements.txt

# 4. Run tests
pytest apps/api/tests
npm.cmd run typecheck

# 5. Start development servers
npm.cmd run dev         # Next.js Web on http://localhost:3000
python -m uvicorn apps.api.src.main:app --port 8000 --reload  # API on http://localhost:8000
```

---

## 6. Official Tagline & Brand Identity
**“Innovate. Implement. Inspire.”**  
AI & Machine Learning Club, Oriental College of Technology, Bhopal.