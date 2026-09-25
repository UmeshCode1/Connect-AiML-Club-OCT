# Database Schema Overview

## Database Engine
- Supabase PostgreSQL 15+
- Extensions: `uuid-ossp`, `pgcrypto`, `pg_trgm`, `vector` (pgvector)

## Core Relational Design
- `accounts`: Auth mapping linking Supabase auth UUIDs to internal accounts.
- `student_profiles`: Canonical student records (enrollment number, full name, course, batch).
- `team_roles` & `team_memberships`: Club executive team & volunteer role assignments.
- `events`: Events aggregate storing slugs, dates, status, visibility, and venue.
- `event_participations`: Mapping students to events with registration status and registration source.
- `attendance_records`: Check-in / check-out timestamps and audit fields.
- `media_assets`: Metadata for photos and videos stored in Google Drive.
- `drive_folders`: Immutable Google Drive folder IDs mapped to events.
- `certificates`: Issued and verified credentials with token hashes and status.
- `audit_logs`: Append-only audit logging for sensitive actions.

## Row-Level Security
Enabled across all tables with public policies for published events and verified certificates.
