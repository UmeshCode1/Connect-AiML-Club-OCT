# AIML CLUB OCT — CONNECT
## Event Management REST API Specification

Version: 1.1  
Base URL: `https://api.aimlcluboct.in/v1`

---

### 1. Event Endpoints

| Method | Endpoint | Permission | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/v1/events` | Public / `events.view` | List events with filtering, search, and pagination. |
| `POST` | `/v1/events` | `events.create` | Create a new event aggregate in `DRAFT`. |
| `GET` | `/v1/events/{id_or_slug}` | Public / `events.view` | Fetch single event details by UUID or slug. |
| `PATCH` | `/v1/events/{event_id}` | `events.update` | Update event metadata, dates, or capacity. |
| `DELETE` | `/v1/events/{event_id}` | `events.delete` | Archive event with audit trail. |
| `POST` | `/v1/events/{event_id}/transition` | `events.update` | Execute validated lifecycle transition. |
| `POST` | `/v1/events/{event_id}/publish` | `events.publish` | Transition event to `REGISTRATION_OPEN`. |
| `POST` | `/v1/events/{event_id}/archive` | `events.delete` | Transition event to terminal `ARCHIVED`. |
| `GET` | `/v1/events/{event_id}/analytics` | `events.view` | Retrieve capacity metrics and breakdown. |

---

### 2. Registration & Participation Endpoints

| Method | Endpoint | Permission | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/v1/events/{event_id}/participants` | Public | Register student for event with deduplication & capacity waitlist. |
| `GET` | `/v1/events/{event_id}/participants` | `participants.view` | View participant roster (confidential student data). |
| `PATCH` | `/v1/events/{event_id}/participants/{id}` | `participants.update` | Update participant status, team, or notes. |
| `DELETE` | `/v1/events/{event_id}/participants/{id}` | `participants.update` | Cancel participant registration. |

---

### 3. Response & Error Envelopes

Success:
```json
{
  "data": {},
  "meta": {
    "page": 1,
    "page_size": 25,
    "total": 1,
    "has_next": false
  }
}
```

Error:
```json
{
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "Permission denied for action: 'events.create'",
    "request_id": "req_84f9b20e18ab"
  }
}
```
