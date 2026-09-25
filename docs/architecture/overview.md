# Systems Architecture Overview

## Overview
Connect is a modular platform serving the AI & Machine Learning Club, Oriental College of Technology, Bhopal.

```text
               PUBLIC CLIENTS (Web / PWA / Admin)
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
      app.aimlcluboct.in              admin.aimlcluboct.in
         (apps/web)                       (apps/admin)
               │                               │
               └───────────────┬───────────────┘
                               ▼
                       api.aimlcluboct.in
                           (apps/api)
                               │
               ┌───────────────┼───────────────┐
               ▼               ▼               ▼
          PostgreSQL      AI Workers     Integrations
         (+ pgvector)     (workers/)    (Tally/Sheets)
               │               │
               └───────┬───────┘
                       ▼
                 Google Drive
              (Large File Storage)
```

## Core Principles
1. **Event-Centric Aggregate**: Events anchor participants, media, certificates, documents, and attendance.
2. **Separation of Concerns**: Identity (`accounts`, `student_profiles`) is decoupled from event instances (`event_participations`).
3. **Storage Boundary**: Structured metadata lives in PostgreSQL; heavy binaries and media reside in Google Drive using immutable file IDs.
4. **Server-Side Authorization**: The FastAPI API is the primary security boundary enforcing granular RBAC.
