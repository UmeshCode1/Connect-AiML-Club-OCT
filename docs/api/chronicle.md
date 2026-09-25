# AIML CLUB OCT — CONNECT
## API Reference: Chronicle Editorial System

Base URL: `/v1/chronicle`  
Tags: `Chronicle`

---

### Endpoints

#### 1. List Chronicle Publications
- **Method / Path**: `GET /v1/chronicle`
- **Access**: Public (Published only) / Staff with `chronicle.view` (All statuses)
- **Query Parameters**:
  - `status`: Filter by status (`DRAFT`, `REVIEW`, `SCHEDULED`, `PUBLISHED`, `ARCHIVED`)
  - `edition_type`: Filter by edition type
  - `search`: Case-insensitive title / excerpt search
  - `page`: Page number (default: 1)
  - `page_size`: Items per page (default: 25, max: 100)
- **Response**: `ApiResponse<List<ChronicleResponse>>`

#### 2. Create Chronicle Draft
- **Method / Path**: `POST /v1/chronicle`
- **Access**: Requires `chronicle.create` (`CONTENT_MANAGER`, `CLUB_ADMIN`, `SUPER_ADMIN`)
- **Request Body**:
  ```json
  {
    "title": "Quantum ML Workshop Recap",
    "slug": "quantum-ml-workshop-recap",
    "edition_type": "EVENT_RECAP",
    "excerpt": "Recap of PennyLane and quantum simulator hands-on tracks.",
    "content": "# Quantum ML Recap\n\nStudent workshop summary...",
    "visibility": "PUBLIC",
    "scheduled_at": null,
    "linked_event_ids": ["00000000-0000-0000-0000-000000000101"]
  }
  ```
- **Response**: `ApiResponse<ChronicleResponse>` (HTTP 201)

#### 3. Get Chronicle by Slug
- **Method / Path**: `GET /v1/chronicle/{slug}`
- **Access**: Public (Published only) / Staff (All statuses)
- **Response**: `ApiResponse<ChronicleResponse>` (HTTP 404 if unpublished and caller is non-staff)

#### 4. Update Chronicle Publication
- **Method / Path**: `PATCH /v1/chronicle/{id}`
- **Access**: Requires `chronicle.update`
- **Request Body**: `ChronicleUpdate` (Partial fields)
- **Response**: `ApiResponse<ChronicleResponse>`

#### 5. Submit Chronicle for Review
- **Method / Path**: `POST /v1/chronicle/{id}/submit-review`
- **Access**: Requires `chronicle.update`
- **Response**: `ApiResponse<ChronicleResponse>` (Transitions state from `DRAFT` to `REVIEW`)

#### 6. Approve Chronicle Publication
- **Method / Path**: `POST /v1/chronicle/{id}/approve`
- **Access**: Requires `chronicle.approve`
- **Response**: `ApiResponse<ChronicleResponse>` (Sets `approved_by` and transitions to `SCHEDULED` or approved state)

#### 7. Publish Chronicle Publication
- **Method / Path**: `POST /v1/chronicle/{id}/publish`
- **Access**: Requires `chronicle.publish`
- **Response**: `ApiResponse<ChronicleResponse>` (Transitions status to `PUBLISHED`, updates `published_at`)
