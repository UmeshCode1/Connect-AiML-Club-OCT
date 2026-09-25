# Backend API Overview

## Base URL & Versioning
- Base domain: `https://api.aimlcluboct.in`
- Current API prefix: `/v1`
- Interactive OpenAPI docs: `/docs`
- ReDoc reference: `/redoc`

## Standard Envelope Contracts
### Single Resource / Success
```json
{
  "data": { ... },
  "meta": {
    "request_id": "req_abc123"
  }
}
```

### Standard Error Response
```json
{
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "You do not have permission to perform this action.",
    "request_id": "req_abc123"
  }
}
```

## Implemented Baseline Endpoints
- `GET /health`: Liveness probe.
- `GET /ready`: Readiness probe.
- `GET /v1/auth/me`: Authenticated profile and RBAC permissions.
- `GET /v1/events`: Public listing of club events.
- `GET /v1/public/certificates/verify/{certificate_id}`: Public certificate verification.
