# AIML CLUB OCT — CONNECT
## API Reference: Journey Institutional Timeline

Base URL: `/v1/journey`  
Tags: `Journey`

---

### Endpoints

#### 1. List Milestones
- **Method / Path**: `GET /v1/journey`
- **Access**: Public (Published only) / Staff with `journey.view` (All statuses)
- **Query Parameters**:
  - `milestone_type`: Filter by category (`FOUNDATION`, `EVENT`, `ACHIEVEMENT`, `PARTNERSHIP`, `LEADERSHIP`, `RESEARCH`, `COLLABORATION`, `OTHER`)
  - `search`: Keyword search in title and description
  - `page`: Page number (default: 1)
  - `page_size`: Items per page (default: 50, max: 100)
- **Response**: `ApiResponse<List<JourneyMilestoneResponse>>` (Chronologically ordered by `milestone_date DESC, display_order ASC`)

#### 2. Create Milestone
- **Method / Path**: `POST /v1/journey`
- **Access**: Requires `journey.create` (`CONTENT_MANAGER`, `CLUB_ADMIN`, `SUPER_ADMIN`)
- **Request Body**:
  ```json
  {
    "title": "State AI Hackathon 1st Prize",
    "slug": "state-ai-hackathon-1st-prize",
    "milestone_date": "2025-11-15",
    "milestone_type": "ACHIEVEMENT",
    "description": "Student team secured first place across 40 collegiate teams.",
    "linked_event_id": "00000000-0000-0000-0000-000000000101",
    "external_link": "https://aimlcluboct.in",
    "status": "PUBLISHED",
    "display_order": 0
  }
  ```
- **Response**: `ApiResponse<JourneyMilestoneResponse>` (HTTP 201)

#### 3. Get Milestone by Slug
- **Method / Path**: `GET /v1/journey/{slug}`
- **Access**: Public (Published only) / Staff (All statuses)
- **Response**: `ApiResponse<JourneyMilestoneResponse>` (HTTP 404 if unpublished and caller is public)

#### 4. Update Milestone
- **Method / Path**: `PATCH /v1/journey/{id}`
- **Access**: Requires `journey.update`
- **Request Body**: `JourneyMilestoneUpdate`
- **Response**: `ApiResponse<JourneyMilestoneResponse>`

#### 5. Publish Milestone
- **Method / Path**: `POST /v1/journey/{id}/publish`
- **Access**: Requires `journey.publish`
- **Response**: `ApiResponse<JourneyMilestoneResponse>` (Sets `status = 'PUBLISHED'`, updates `published_at`)
