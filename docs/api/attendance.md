# AIML CLUB OCT — CONNECT
## API Reference: Attendance & Session Operations (Phase 3)

### Endpoints Overview

#### 1. Sessions Management (`/api/v1/sessions`)
| Method | Path | Required Permission | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/events/{event_id}/sessions` | Public / `attendance.view` | List all sessions for an event |
| `POST` | `/events/{event_id}/sessions` | `events.update` | Create a new session under an event |
| `GET` | `/sessions/{session_id}` | Public / `attendance.view` | Retrieve session details |
| `PATCH` | `/sessions/{session_id}` | `events.update` | Update session schedule or status |
| `DELETE` | `/sessions/{session_id}` | `events.delete` | Delete a session |

#### 2. Attendance Ledger (`/api/v1/attendance`)
| Method | Path | Required Permission | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/sessions/{session_id}/check-in` | `attendance.mark` | Process QR or manual check-in |
| `POST` | `/sessions/{session_id}/check-out` | `attendance.mark` | Process session check-out |
| `GET` | `/sessions/{session_id}/records` | `attendance.view` | List session attendance records |
| `POST` | `/records/{record_id}/correct` | `attendance.correct` | Administrative status correction |
| `GET` | `/events/{event_id}/metrics` | `attendance.view` | Event attendance statistics |
| `GET` | `/qr-pass` | Authenticated | Retrieve student HMAC QR pass |

#### 3. Volunteer Assignments (`/api/v1/volunteers`)
| Method | Path | Required Permission | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/events/{event_id}/volunteers` | `volunteers.view` | List event volunteer roster |
| `POST` | `/events/{event_id}/volunteers` | `volunteers.assign` | Assign volunteer with role |
| `DELETE` | `/events/{event_id}/volunteers/{user_id}` | `volunteers.assign` | Revoke volunteer assignment |

---

### Security Boundaries
- Attendance routes enforce bearer token authentication with fine-grained scopes: `attendance.view`, `attendance.mark`, `attendance.correct`.
- Check-in payloads requiring QR tokens are cryptographically verified with HMAC-SHA256. Invalid or expired tokens return HTTP 400 Bad Request. Duplicate check-ins return HTTP 409 Conflict.
