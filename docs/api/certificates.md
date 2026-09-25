# AIML CLUB OCT — CONNECT
## Phase 5 API Specification: Certificate Engine & Verification System

Version: 1.4.0  
Base URL: `https://api.aimlcluboct.in/v1`

---

### 1. Endpoints Overview

| Method | Endpoint | Access / Permission | Description |
|---|---|---|---|
| `GET` | `/public/certificates/verify/{certificate_id}` | Public | Verify certificate authenticity without private PII |
| `GET` | `/certificates/me/certificates` | Authenticated Student | Retrieve personal issued certificates |
| `POST` | `/certificate-templates` | `certificates.template.manage` | Create certificate template definition |
| `POST` | `/certificate-templates/{id}/versions` | `certificates.template.manage` | Create immutable template version |
| `GET` | `/events/{event_id}/certificates/eligibility` | `certificates.view` | Calculate dynamic recipient eligibility |
| `POST` | `/events/{event_id}/certificates/batches` | `certificates.create` | Create certificate issuance batch |
| `POST` | `/certificate-batches/{id}/generate` | `certificates.generate` | Trigger worker batch rendering |
| `POST` | `/certificate-batches/{id}/approve` | `certificates.approve` | Approve generated batch |
| `POST` | `/certificate-batches/{id}/issue` | `certificates.issue` | Issue batch and publish to verification ledger |
| `POST` | `/certificates/{id}/revoke` | `certificates.revoke` | Revoke certificate with mandatory audit reason |
| `POST` | `/certificates/{id}/replace` | `certificates.replace` | Replace certificate with mandatory audit reason |

---

### 2. Request & Response Contracts

#### Public Verification
`GET /v1/public/certificates/verify/{certificate_id}`

**Successful Response (`200 OK`):**
```json
{
  "data": {
    "valid": true,
    "certificate_id": "AIML26-APT-000184",
    "recipient_name": "Priya Sharma",
    "event_title": "Aptify 2.0: AI Symposium",
    "event": "Aptify 2.0: AI Symposium",
    "event_date": "October 15, 2026",
    "certificate_type": "PARTICIPATION",
    "issued_at": "2026-10-15T18:30:00Z",
    "status": "ISSUED",
    "verification_url": "https://aimlcluboct.in/verify/AIML26-APT-000184",
    "revoked_at": null,
    "revoke_reason": null,
    "replaced_by_certificate_id": null
  },
  "error": null,
  "meta": {
    "timestamp": "2026-09-25T12:00:00Z",
    "request_id": "req-verify-001"
  }
}
```

**Revoked Credential Response (`200 OK`):**
```json
{
  "data": {
    "valid": false,
    "certificate_id": "AIML26-APT-000186",
    "recipient_name": "Aman Khan",
    "event_title": "Aptify 2.0: AI Symposium",
    "certificate_type": "PARTICIPATION",
    "status": "REVOKED",
    "revoked_at": "2026-10-16T10:00:00Z",
    "revoke_reason": "Attendance threshold requirement not satisfied after audit review."
  }
}
```

**Unissued or Invalid Credential Response (`404 Not Found`):**
```json
{
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "Certificate with ID 'INVALID-ID-999' was not found or is unverified.",
    "details": null
  }
}
```

---

#### Revocation Contract
`POST /v1/certificates/{certificate_id}/revoke`

**Request:**
```json
{
  "reason": "Administrative dispute: attendee withdrew from competition"
}
```

#### Replacement Contract
`POST /v1/certificates/{certificate_id}/replace`

**Request:**
```json
{
  "reason": "Official legal name spelling correction per institutional ID"
}
```
