# AIML CLUB OCT — CONNECT
## Persistent Engineering Instructions for AI Coding Agents (`AGENTS.md`)

Version: 1.0  
Last Updated: 2026-09-25  
Repository: `UmeshCode1/Connect-AiML-Club-OCT`  
Organization: AI & Machine Learning Club, Oriental College of Technology, Bhopal  
Official Tagline: “Innovate. Implement. Inspire.”

---

### 1. Mandatory Core Operating Rules

Every AI coding agent operating in this repository MUST strictly follow these rules:

1. **Inspect Before Modifying**: Never assume file structure, dependencies, or configuration. Inspect existing files, directories, and git status before proposing changes.
2. **Read Specifications First**: Primary specifications reside in `docs/specifications/` (numbered 01 to 17). Consult them before making architectural or domain changes.
3. **Follow the Documented Architecture**: Adhere strictly to the monorepo structure (`apps/web`, `apps/admin`, `apps/api`, `packages/`, `supabase/`, `docs/`). Do not introduce competing architectures or premature microservices.
4. **Reuse Existing Code**: Always prioritize reusing established components, tokens, utilities, and models. Avoid unnecessary duplicate implementations.
5. **No Unnecessary Rewrites**: Build incrementally. Never discard existing working code to replace it with an unrequested alternative.
6. **Preserve Club & Institutional Branding**:
   - Official brand: AIML CLUB OCT — CONNECT
   - Tagline: "Innovate. Implement. Inspire."
   - Colors: Institutional Blue (`#014B7A`), Institutional Green (`#00763C`), Dark Surface (`#111820`), Neutrals, and Club Lime Accent (used sparingly).
   - Use official assets located in `packages/assets/brand/` and `apps/web/public/brand/`. Do not redesign, recolor, or regenerate brand logos.
7. **Preserve Existing Website & Domains**:
   - The public website `https://aimlcluboct.in` must remain intact.
   - Connect powers the extended ecosystem across subdomains:
     - `app.aimlcluboct.in` (Member / student PWA)
     - `admin.aimlcluboct.in` (Administration)
     - `api.aimlcluboct.in` (FastAPI backend)
   - Do not alter, break, or repurpose existing subdomains like `voice.aimlcluboct.in` or `social.aimlcluboct.in`.
8. **Protect Private Student Data**:
   - Student identities, contact numbers, email addresses, personal attendance, and internal records are private by default.
   - Never expose private participant records through public endpoints, client prefetching, search indexes, or sitemaps.
9. **Protect Biometric & Face Data**:
   - Face matching is an opt-in discovery feature, NOT a public identification system.
   - Never commit or expose raw face embeddings publicly.
   - Always verify explicit consent before processing biometric data.
10. **Never Commit Secrets**:
    - Never hardcode or commit API keys, Google Service Account JSON keys, Supabase Service Role keys, JWT secrets, or database passwords.
    - Reference `.env.example` for required variables. Ensure `.env` is listed in `.gitignore`.
11. **Follow Granular RBAC**:
    - Enforce permissions on the backend API layer. Client-side route guards are for UX only, not security boundaries.
    - Adhere to the core roles: `SUPER_ADMIN`, `CLUB_ADMIN`, `EVENT_MANAGER`, `MEDIA_MANAGER`, `CERTIFICATE_MANAGER`, `CONTENT_MANAGER`, `VOLUNTEER`, `VIEWER`.
12. **Follow Testing Requirements**:
    - Every new feature or endpoint must include automated unit/integration tests.
    - Never write meaningless placeholder tests. Maintain smoke test suites for foundation integrity.
13. **Follow Accessibility (a11y) & SEO Requirements**:
    - Meet WCAG 2.2 AA standards: semantic markup, high-contrast, keyboard navigability, touch targets ≥ 44px, and `prefers-reduced-motion` compliance.
    - Public pages (`/events`, `/journey`, `/chronicle`, `/verify/[id]`) must support SSR/SSG metadata and Open Graph tags. Private/admin pages must be blocked from search indexing (`noindex`).
14. **Keep Documentation Synchronized**:
    - Maintain and update documentation in `docs/` reflecting the actual implemented state.
    - Never mark planned features as completed in docs.
15. **Make Small, Meaningful Commits**:
    - Use clear conventional commit messages (e.g., `chore:`, `feat:`, `fix:`, `docs:`, `test:`).
    - Avoid huge, unreviewable monolithic commits.
16. **Do NOT Build Ahead of the Approved Roadmap**:
    - Implement features according to `17_DEVELOPMENT_ROADMAP.md`.
    - Stop at phase completion and await user review and approval before proceeding to the next phase.

---

### 2. Technology Stack Standards

- **Frontend (`apps/web`, `apps/admin`)**:
  - Next.js (App Router), React 19, TypeScript
  - CSS / Design System: Semantic tokens, accessible CSS variables, high-performance responsive layout.
  - PWA: Web App Manifest, offline shell, service worker readiness.
- **Backend (`apps/api`)**:
  - FastAPI (Python 3.12+), Pydantic v2
  - Structure: Routers (`api/v1`), Core config (`core/config.py`), Security (`core/security.py`), Database layer (`db/`), Service layer (`services/`).
  - OpenAPI auto-documentation at `/docs`.
- **Database & Storage**:
  - Supabase PostgreSQL with `pgvector`, `pg_trgm`, `uuid-ossp`.
  - Immutable Google Drive IDs for large media files (never identify files/folders by arbitrary name paths).
- **Integrations**:
  - Tally, Google Sheets, Email, official WhatsApp Business API (future).

---

### 3. Contact & Governance

- Club: AI & Machine Learning Club, Oriental College of Technology (OCT), Bhopal.
- Repository: https://github.com/UmeshCode1/Connect-AiML-Club-OCT
- Lead Maintainer: Umesh Patel
