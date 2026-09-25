# AIML Club OCT — Connect
## API Specification

Version: 1.0

Base URL:

`https://api.aimlcluboct.in`

---

## 1. API Principles

The API is the business-logic boundary for Connect.

Rules:

1. RESTful resource naming.
2. JSON request/response format.
3. Authentication through bearer tokens/session mechanism.
4. Backend authorization on every protected resource.
5. Consistent error format.
6. Pagination for collections.
7. Filtering and sorting where appropriate.
8. Idempotency for long-running or externally-triggered operations.
9. Version the API when breaking changes are introduced.
10. Never expose secrets or internal service credentials.

Recommended initial version:

`/v1`

---

## 2. Response Envelope

Successful single-resource response:

```json
{
  "data": {},
  "meta": {}
}
```

Collection:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "page_size": 25,
    "total": 100,
    "has_next": true
  }
}
```

---

## 3. Error Format

```json
{
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "You do not have permission to perform this action.",
    "request_id": "req_..."
  }
}
```

Do not expose stack traces in production.

---

## 4. Authentication

Example:

```http
Authorization: Bearer <access_token>
```

Authentication endpoints may include:

```text
POST /v1/auth/session
POST /v1/auth/logout
GET  /v1/auth/me
```

If Supabase Auth is used, the application may use Supabase's supported session mechanism while the API validates the resulting identity.

---

## 5. Events

```text
GET    /v1/events
POST   /v1/events
GET    /v1/events/{event_id}
PATCH  /v1/events/{event_id}
DELETE /v1/events/{event_id}
POST   /v1/events/{event_id}/publish
POST   /v1/events/{event_id}/archive
```

Query examples:

```text
GET /v1/events?status=COMPLETED
GET /v1/events?year=2026
GET /v1/events?search=aptify
```

---

## 6. Event Participants

```text
GET    /v1/events/{event_id}/participants
POST   /v1/events/{event_id}/participants
PATCH  /v1/events/{event_id}/participants/{participation_id}
DELETE /v1/events/{event_id}/participants/{participation_id}

POST /v1/events/{event_id}/participants/import
GET  /v1/events/{event_id}/participants/export
```

Import must support validation before commit.

---

## 7. Attendance

```text
GET  /v1/events/{event_id}/attendance
POST /v1/events/{event_id}/attendance/check-in
POST /v1/events/{event_id}/attendance/check-out
PATCH /v1/events/{event_id}/attendance/{attendance_id}
```

Check-in payload:

```json
{
  "student_id": "uuid",
  "source": "QR"
}
```

The server determines the timestamp.

Do not trust a client-supplied attendance timestamp without an explicit administrative workflow.

---

## 8. Media

```text
GET    /v1/events/{event_id}/media
POST   /v1/events/{event_id}/media
GET    /v1/media/{media_id}
DELETE /v1/media/{media_id}

POST /v1/media/{media_id}/process
POST /v1/media/{media_id}/retry
```

For large files, prefer direct/resumable upload flows rather than sending the entire file through the API server.

---

## 9. Google Drive Upload Flow

Recommended:

```text
POST /v1/events/{event_id}/media/upload-session
```

Response:

```json
{
  "data": {
    "upload_id": "upload_...",
    "provider": "google_drive",
    "instructions": {}
  }
}
```

After upload:

```text
POST /v1/media/{media_id}/complete
```

The server validates metadata and queues processing.

---

## 10. Face Enrollment

```text
GET  /v1/me/face-enrollment
POST /v1/me/face-enrollment
DELETE /v1/me/face-enrollment
```

Enrollment must require consent.

Example:

```json
{
  "consent_version": "2026-01"
}
```

Actual biometric processing should occur server-side/worker-side.

Never send raw embeddings to ordinary clients.

---

## 11. Face Search

```text
POST /v1/me/memories/search
```

Possible payload:

```json
{
  "event_id": "uuid",
  "limit": 50
}
```

Server flow:

```text
Authenticate
→ Verify enrollment
→ Generate/query embedding
→ Vector search
→ Apply visibility
→ Apply event authorization
→ Rank
→ Return media
```

---

## 12. Face Match Reports

```text
POST /v1/media/{media_id}/face-report
GET  /v1/admin/face-reports
PATCH /v1/admin/face-reports/{report_id}
```

---

## 13. Videos

```text
GET /v1/events/{event_id}/videos
GET /v1/videos/{media_id}/moments
POST /v1/videos/{media_id}/process
```

Example response:

```json
{
  "data": [
    {
      "video_id": "uuid",
      "start_seconds": 84,
      "end_seconds": 102
    }
  ]
}
```

---

## 14. Certificates

```text
GET  /v1/me/certificates
GET  /v1/certificates/{certificate_id}
POST /v1/certificate-templates
PATCH /v1/certificate-templates/{template_id}

POST /v1/events/{event_id}/certificates/preview
POST /v1/events/{event_id}/certificates/generate
POST /v1/certificates/{certificate_id}/issue
POST /v1/certificates/{certificate_id}/revoke
POST /v1/certificates/{certificate_id}/reissue
```

Bulk generation must be asynchronous.

Return a job ID:

```json
{
  "data": {
    "job_id": "job_..."
  }
}
```

---

## 15. Certificate Verification

Public:

```text
GET /v1/public/certificates/verify/{certificate_id}
```

Verification should not require authentication.

Response should contain minimal public information:

```json
{
  "data": {
    "valid": true,
    "certificate_id": "AIML26-APT-000184",
    "recipient_name": "Example Student",
    "event": "Aptify 2.0",
    "certificate_type": "Participation",
    "issued_at": "2026-..."
  }
}
```

Do not expose:

- email
- phone
- enrollment number
- private attendance
- internal IDs
- verification token

unless explicitly required by the club's public verification policy.

---

## 16. Feedback

```text
POST /v1/events/{event_id}/feedback
GET  /v1/events/{event_id}/feedback
PATCH /v1/feedback/{feedback_id}
POST /v1/feedback/{feedback_id}/publish
```

Public endpoints should expose only records that satisfy publication consent and visibility rules.

---

## 17. Chronicle

```text
GET    /v1/chronicle
POST   /v1/chronicle
GET    /v1/chronicle/{slug}
PATCH  /v1/chronicle/{id}
POST   /v1/chronicle/{id}/submit-review
POST   /v1/chronicle/{id}/approve
POST   /v1/chronicle/{id}/publish
```

---

## 18. Journey

```text
GET    /v1/journey
POST   /v1/journey
GET    /v1/journey/{slug}
PATCH  /v1/journey/{id}
POST   /v1/journey/{id}/publish
```

---

## 19. Projects

```text
GET    /v1/projects
POST   /v1/projects
GET    /v1/projects/{slug}
PATCH  /v1/projects/{id}
DELETE /v1/projects/{id}
POST   /v1/projects/{id}/publish
```

---

## 20. Research

```text
GET    /v1/research
POST   /v1/research
GET    /v1/research/{slug}
PATCH  /v1/research/{id}
```

---

## 21. Learning

```text
GET    /v1/learning
POST   /v1/learning
GET    /v1/learning/{slug}
PATCH  /v1/learning/{id}
```

---

## 22. Search

```text
GET /v1/search?q=aptify
```

Optional:

```text
GET /v1/search?q=aptify&type=event
GET /v1/search?q=certificate&type=certificate
```

Search results must be authorization-aware.

---

## 23. Integrations

Admin only:

```text
GET  /v1/integrations
POST /v1/integrations/{provider}/sync
GET  /v1/integrations/{provider}/status
```

Providers:

```text
TALLY
GOOGLE_SHEETS
GOOGLE_DRIVE
EMAIL
```

Do not return provider secrets.

---

## 24. Jobs

```text
GET /v1/jobs/{job_id}
POST /v1/jobs/{job_id}/retry
```

Job response:

```json
{
  "data": {
    "id": "job_...",
    "type": "CERTIFICATE_GENERATION",
    "status": "RUNNING",
    "progress": 63
  }
}
```

---

## 25. Audit Logs

Admin:

```text
GET /v1/admin/audit-logs
GET /v1/admin/audit-logs/{id}
```

Audit endpoints must themselves be protected.

---

## 26. Pagination

Default:

`page_size=25`

Maximum should be bounded.

For very large datasets, cursor pagination may be preferable.

---

## 27. Filtering

Use explicit parameters.

Example:

```text
/events?status=COMPLETED&year=2026
```

Avoid arbitrary SQL-like filter expressions from clients.

---

## 28. Idempotency

Use idempotency keys for operations such as:

- Certificate generation
- Payment-like future operations
- External webhook processing
- Import execution
- Drive creation
- Notification sending

Example:

```http
Idempotency-Key: <unique-key>
```

---

## 29. Webhooks

Webhook endpoints:

```text
POST /v1/webhooks/tally
```

Requirements:

- Verify signature where supported.
- Validate payload.
- Record event ID.
- Reject duplicate events.
- Process asynchronously.
- Audit failures.

---

## 30. Rate Limits

Rate-limit at minimum:

- Authentication
- Face search
- Public verification
- Search
- Upload session creation
- Webhooks
- Admin exports

Do not expose exact security-sensitive rate-limit internals unnecessarily.

---

## 31. API Versioning

Breaking changes require a new API version.

Example:

`/v1`

Later:

`/v2`

Do not silently change response contracts used by deployed clients.

---

## 32. OpenAPI

FastAPI should generate OpenAPI documentation.

Recommended internal development URLs:

```text
/api/docs
/api/redoc
```

Production exposure should be restricted or protected if the API documentation reveals sensitive implementation details.
