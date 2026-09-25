# AIML Club OCT — Connect
## Development Roadmap

Version: 1.0

## 1. Development Philosophy

Build a reliable foundation before advanced AI features.

Do not attempt to build every module simultaneously.

Recommended progression:

```text
Foundation
→ Operations
→ Media
→ Credentials
→ Content
→ Knowledge
→ Advanced AI
```

## 2. Phase 0 — Repository Audit

Before writing major code:

- inspect repository
- identify current framework
- inspect package manager
- inspect database
- inspect routes
- inspect existing components
- inspect deployment
- inspect environment variables
- inspect existing integrations
- identify technical debt

Deliverable:

`docs/REPOSITORY_AUDIT.md`

No major rewrite before this audit.

## 3. Phase 1 — Foundation

Build:

- design tokens
- shared UI
- authentication
- account mapping
- RBAC
- database migrations
- API foundation
- audit logging
- error handling

Exit criteria:

- login works
- roles work
- protected API works
- database migrations are reproducible

## 4. Phase 2 — Events

Build:

- event CRUD
- event lifecycle
- event pages
- event permissions
- Drive folder creation
- tasks
- documents

Exit criteria:

Administrator can create and manage a real event.

## 5. Phase 3 — Registration

Integrate:

- Tally
- Google Sheets
- manual participant entry
- CSV/XLSX import

Build:

- validation
- deduplication
- conflict center
- participant management

Exit criteria:

A real event can be populated from existing club workflows.

## 6. Phase 4 — Attendance

Build:

- participant attendance
- team attendance
- QR check-in
- check-out
- corrections
- audit

Exit criteria:

Event attendance can be reliably recorded and reported.

## 7. Phase 5 — Media

Build:

- Drive integration
- photo upload
- gallery
- video upload
- processing jobs
- media visibility
- duplicate detection

Exit criteria:

A large event media library works without loading everything into the browser.

## 8. Phase 6 — Face Discovery

Build:

- opt-in enrollment
- face detection
- embeddings
- vector search
- personal gallery
- false-match reporting
- deletion/withdrawal

Start with photographs.

Do not begin with full video recognition.

## 9. Phase 7 — Certificates

Build:

- templates
- field configuration
- preview
- eligibility rules
- bulk generation
- Drive storage
- QR verification
- revoke/reissue

Exit criteria:

A complete event certificate batch can be generated and publicly verified.

## 10. Phase 8 — Communication

Build:

- notification system
- email templates
- event announcements
- Chronicle
- feedback
- audience segmentation

Future:

official WhatsApp Business integration.

## 11. Phase 9 — Journey & Knowledge

Build:

- Journey
- Projects
- Research
- Learning
- public archive

Connect these modules to canonical event data.

## 12. Phase 10 — Advanced Video

Build:

- key-frame sampling
- face tracking
- video moments
- timestamp search

Only after photo matching is stable.

## 13. Phase 11 — Analytics & Reports

Build:

- event analytics
- participation analytics
- media analytics
- certificate analytics
- annual report
- event report

Prefer generated analytics from canonical data.

## 14. Phase 12 — PWA/Mobile

Finalize:

- mobile navigation
- offline shell
- installability
- camera
- QR
- mobile gallery
- certificate wallet

## 15. Phase 13 — SEO & Public Experience

Finalize:

- metadata
- sitemap
- structured data
- performance
- public archive
- image SEO
- internal linking

## 16. Phase 14 — Production Hardening

Perform:

- security review
- privacy review
- accessibility review
- performance testing
- backup testing
- disaster recovery test
- migration verification
- monitoring setup

## 17. Priority Levels

P0:

- authentication
- authorization
- database
- events
- participant management
- Drive
- security

P1:

- attendance
- media
- certificates
- Tally
- Sheets
- search

P2:

- feedback
- Chronicle
- Journey
- Projects
- Research
- Learning

P3:

- video face moments
- advanced AI
- advanced analytics
- automation enhancements

## 18. Definition of Done

A feature is done only when:

- implemented
- API secured
- permissions enforced
- mobile considered
- loading/error/empty states implemented
- tests added
- accessibility considered
- audit added if sensitive
- documentation updated
- production build passes

## 19. Antigravity Working Rule

Antigravity must not implement all phases in one operation.

For each phase:

```text
Read specification
→ Inspect current implementation
→ Plan
→ Implement
→ Test
→ Review
→ Update documentation
→ Commit
```

Do not silently redesign architecture during implementation.

## 20. First Development Task

Before feature development:

**Create a repository audit.**

Required audit output:

```text
Current framework
Current frontend
Current backend
Current database
Current authentication
Current routes
Current components
Current integrations
Current deployment
Current dependencies
Current technical debt
Recommended migration path
```

Then compare the audit against documents 01–17.
