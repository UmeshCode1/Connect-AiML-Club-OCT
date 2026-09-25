# AIML CLUB OCT — CONNECT
## Architecture Specification: Media Intelligence & Biometric Privacy Gate (Phase 4)

### 1. Overview & Core Philosophy
Phase 4 introduces media asset management, asynchronous processing pipelines, and AI-assisted photo discovery for authenticated club members. Recognizing the sensitivity of facial embeddings, Connect enforces a strict **Biometric Privacy Gate**:
- Biometric processing is **strictly opt-in**.
- Unknown faces are **never identified or assigned an identity**.
- Face search is **strictly event-scoped**.
- Raw embedding vectors are **never exposed to browser clients or public APIs**.
- Students maintain the right to **instant consent withdrawal and permanent biometric erasure**.

---

### 2. Physical & Architectural Separation
1. **Raw Media Storage**:
   - Google Drive is the canonical storage layer for high-resolution event photographs, videos, posters, and documents.
   - Identified strictly by immutable `google_drive_file_id` strings (never arbitrary folder paths).
2. **Relational Metadata**:
   - Stored in PostgreSQL `media_assets` with visibility tags (`PUBLIC`, `EVENT_MEMBERS`, `TEAM_ONLY`, `ADMIN_ONLY`, `HIDDEN`).
3. **Internal Biometric Vectors**:
   - Stored in PostgreSQL using `pgvector` in `face_embeddings` and `media_faces`.
   - Accessible only by internal backend worker services and protected by Row-Level Security (RLS).
   - Excluded from all standard API serializers and client-side models.

---

### 3. Media Ingestion Boundary
Media uploads undergo rigorous verification before ingestion:
- **MIME Validation**: Allowed types restricted to `image/jpeg`, `image/png`, `image/webp`, `video/mp4`, `video/webm`, `application/pdf`.
- **Size Bounds**: Maximum 50MB for photographs and documents; maximum 500MB for video files.
- **Defensive Filename Sanitation**: Path traversal tokens (`..`, `/`, `\`) and dangerous executable extensions (`.exe`, `.sh`, `.php`, `.py`, etc.) are unconditionally rejected.
- **Deduplication**: Monitored via SHA-256 checksums and immutable Google Drive file IDs.

---

### 4. Opt-in Biometric Consent Lifecycle
```text
[ Unenrolled Student ]
        ↓ (Explicit opt-in: confirm_opt_in = true, consent_version = 'v1.0')
[ Active Face Enrollment ] → Generates reference vector (512-dim)
        ↓ (Event-scoped discovery: student attended Event X)
[ Discovered Photos in Event X ]
        ↓ (Student reports false positive)
[ "Not Me" Dispute Workflow ] → Photo hidden from gallery → Admin unlinks match
        ↓ (Student requests withdrawal / account deletion)
[ Hard Deletion ] → DELETE FROM face_embeddings → Status = 'WITHDRAWN'
```

---

### 5. Event Scoping & Anti-Surveillance
Face search requests enforce an inner join with event participation records (`event_participations` / `attendance_records`). A student participating only in "Event A" cannot search or match faces in "Event B".
No public endpoint exists to query "Who is this person?".
