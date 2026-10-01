# PHASE 7 — REAL-TIME CANDIDATES & ARCHITECTURAL EVALUATION

**Status**: Planning / Reference Only (No implementation in Phase 7.2)  
**Date**: 2026-10-01  
**Scope**: Admin Operations & Knowledge Workflows  

---

## 1. Architectural Principle

In accordance with Phase 7 instructions and `02_SYSTEM_ARCHITECTURE.md`:
- Standard admin CRUD and administrative management workflows operate via idempotent, RESTful HTTPS API requests (`/v1/projects`, `/v1/research`, `/v1/learning`, etc.).
- WebSockets or ad-hoc pub/sub connections are **NOT** added for basic CRUD operations or speculative features.
- Any future real-time updates must first evaluate **Supabase Realtime (PostgreSQL CDC / Broadcast)** before introducing a custom or persistent WebSocket server daemon in FastAPI.

---

## 2. Identified Concrete Real-Time Candidates

The following administrative and operational workflows represent high-value candidates where real-time state synchronization would materially improve operational correctness, prevent race conditions, and enhance live event coordination:

### A. Live Attendance & QR Gate Operations
- **Current Pattern**: Polling or manual refresh during badge scanning.
- **Real-Time Benefit**: Check-in stations (multiple volunteers scanning passes simultaneously at physical entrances) receive instant check-in confirmation and deduplication alerts.
- **Recommended Technology**: Supabase Realtime Postgres Changes on `attendance_records` filtered by `event_id`.

### B. Event Registration Capacity Counters
- **Current Pattern**: Optimistic check against database capacity during submission.
- **Real-Time Benefit**: Live ticket/seat counters on both admin oversight dashboards and member registration screens to immediately close registrations when sold out, preventing overselling without excessive database polling.
- **Recommended Technology**: Supabase Realtime Broadcast or postgres changes on `event_registrations`.

### C. Live Event Dashboard & Volunteer Dispatch
- **Current Pattern**: Static view refreshed manually.
- **Real-Time Benefit**: Head organizers dispatching volunteers or managing incident reports during active hackathons/workshops need live status counters (number of verified attendees, pending queries, room capacities).
- **Recommended Technology**: Supabase Realtime Broadcast channels for admin telemetry.

### D. Knowledge Showcase Moderation Queue
- **Current Pattern**: Manual table refresh on `/projects`, `/research`, and `/learning`.
- **Real-Time Benefit**: When multiple club leads and content managers review submitted student projects or research artifacts during a project expo, incoming submissions or status transitions (e.g., another admin approving or marking as `IN_DEVELOPMENT`) update across active review dashboards immediately.
- **Recommended Technology**: Supabase Realtime Postgres Changes on `projects` and `research_items` where `status = 'DRAFT'` or `visibility = 'INTERNAL'`.

### E. Collaborative Contributor Attribution Updates
- **Current Pattern**: Admin visits `/projects/[id]` to review members and attribution.
- **Real-Time Benefit**: Broadcast notifications when a project lead submits new contributors for review or updates repository links, alerting reviewing content managers without requiring a reload.

---

## 3. Evaluation: Supabase Realtime vs. Custom WebSocket Server

| Criteria | Supabase Realtime (Recommended First) | Custom WebSocket (FastAPI) |
| :--- | :--- | :--- |
| **Infrastructure Overhead** | Zero additional servers; managed by Supabase cluster. | Requires long-running server instances, ASGI worker scaling, sticky sessions or Redis pub/sub backplane. |
| **Row-Level Security (RLS)** | Built-in RLS evaluation ensures clients only receive rows they are authorized to read. | Requires custom JWT verification and manual authorization query per message. |
| **Reconnection & State** | Built-in exponential backoff, presence tracking, and heartbeat. | Requires custom client-side reconnect and queue management logic. |
| **Database Coupling** | Native WAL (Write-Ahead Log) replication via `wal2json` or logical replication. | Requires application hooks or polling database triggers. |
| **Verdict** | **Primary Choice**: Perfectly fits the Next.js / Supabase monorepo architecture. | **Deferred**: Only consider if arbitrary bidirectional binary streaming is required (e.g. video processing pipelines). |

---

## 4. Next Steps & Hard Boundary

- Real-time features remain deferred.
- No real-time implementation is permitted until explicitly scheduled in future roadmap phases.
- Current Phase 7 administrative workflows remain purely API-driven, resilient, and accessible via standard HTTP/S.
