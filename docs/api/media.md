# AIML CLUB OCT — CONNECT
## API Reference: Media Intelligence & Biometric Privacy (Phase 4)

### Endpoints Overview

#### 1. Media Assets Ingestion & Query
| Method | Path | Permission Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/v1/events/{event_id}/media` | `media.upload` | Ingest media asset linked to Google Drive ID |
| `GET` | `/v1/events/{event_id}/media` | `media.view` | List non-hidden media assets for event |
| `GET` | `/v1/media/{media_id}` | `media.view` | Retrieve metadata for single media asset |

#### 2. Biometric Consent & Student Enrollment
| Method | Path | Permission Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/v1/me/face-enrollment` | Authenticated Student | Check personal biometric enrollment status |
| `POST` | `/v1/me/face-enrollment` | Authenticated Student | Register explicit opt-in biometric consent |
| `DELETE` | `/v1/me/face-enrollment` | Authenticated Student | Withdraw consent & permanently delete vectors |

#### 3. Event-Scoped Photo Discovery
| Method | Path | Permission Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/v1/events/{event_id}/media/search-faces` | Authenticated Student | Event-scoped face match discovery |

#### 4. False-Match Dispute Resolution ("Not Me")
| Method | Path | Permission Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/v1/media/{media_id}/face-report` | Authenticated Student | Report false match dispute on detected photo |
| `GET` | `/v1/admin/face-reports` | `media.process` | List open/resolved student dispute reports |
| `PATCH` | `/v1/admin/face-reports/{report_id}` | `media.process` | Resolve dispute & unlink candidate face |

---

### Request & Response Contracts

#### Ingest Media Asset (`POST /v1/events/{event_id}/media`)
```json
{
  "event_id": "00000000-0000-0000-0000-000000000101",
  "media_type": "PHOTO",
  "title": "Aptify 2026 Keynote Stage",
  "original_filename": "stage_keynote_01.jpg",
  "mime_type": "image/jpeg",
  "file_size": 4194304,
  "google_drive_file_id": "1DriveFileAptifyKeynotePhoto001",
  "visibility": "EVENT_MEMBERS"
}
```

#### Face Search Response (`POST /v1/events/{event_id}/media/search-faces`)
```json
{
  "data": {
    "event_id": "00000000-0000-0000-0000-000000000101",
    "student_id": "00000000-0000-0000-0000-000000000002",
    "total_matches": 2,
    "matches": [
      {
        "media_asset_id": "med-01",
        "title": "Aptify 2026 Keynote Stage",
        "original_filename": "aptify_keynote_stage.jpg",
        "google_drive_file_id": "1DriveFileAptifyKeynotePhoto001",
        "confidence_tier": "HIGH",
        "similarity_score": 0.89,
        "created_at": "2026-10-15T10:15:00Z"
      }
    ]
  }
}
```
*Note: Embeddings and vector representations are never exposed in any API contract.*
