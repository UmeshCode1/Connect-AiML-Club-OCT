# AIML CLUB OCT — CONNECT
## API Reference: Event Feedback & Moderation System

Tags: `Feedback`

---

### Endpoints

#### 1. Submit Event Feedback
- **Method / Path**: `POST /v1/events/{event_id}/feedback`
- **Access**: Authenticated Student / Attendee (`get_current_user`)
- **Request Body**:
  ```json
  {
    "rating": 5,
    "feedback_text": "The computer vision hands-on session was exceptionally structured and practical!",
    "suggestion_text": "Would love an advanced multi-modal agent track next time.",
    "publication_consent": "ANONYMOUS",
    "source": "PORTAL"
  }
  ```
- **Response**: `ApiResponse<FeedbackResponse>` (HTTP 201)
- **Error Codes**:
  - `404 NOT FOUND`: If `event_id` does not exist.
  - `409 CONFLICT`: If the student has already submitted feedback for this event.

#### 2. List Event Feedback (Public & Admin)
- **Method / Path**: `GET /v1/events/{event_id}/feedback`
- **Access**:
  - **Public / Unauthenticated**: Returns only approved testimonials (`moderation_status = 'APPROVED'`, `visibility = 'PUBLIC'`). Student contact info, internal IDs, email, and phone numbers are completely stripped. Returns `ApiResponse<List<PublicFeedbackResponse>>`.
  - **Staff with `feedback.view`** (`EVENT_MANAGER`, `CONTENT_MANAGER`, `CLUB_ADMIN`): Returns full administrative records with student names, enrollment numbers, and moderation controls. Returns `ApiResponse<List<FeedbackResponse>>`.
- **Query Parameters**:
  - `moderation_status`: Filter by status (`PENDING`, `APPROVED`, `REJECTED`)
  - `rating`: Filter by star rating (1–5)
  - `page`: Page index (default: 1)
  - `page_size`: Page size (default: 25)

#### 3. Get Event Feedback Summary
- **Method / Path**: `GET /v1/events/{event_id}/feedback/summary`
- **Access**: Public
- **Response**: `ApiResponse<FeedbackSummaryResponse>`
  ```json
  {
    "data": {
      "event_id": "00000000-0000-0000-0000-000000000101",
      "total_feedback": 14,
      "average_rating": 4.86,
      "rating_distribution": {
        "1": 0,
        "2": 0,
        "3": 1,
        "4": 3,
        "5": 10
      },
      "pending_moderation_count": 2,
      "approved_count": 11,
      "rejected_count": 1
    }
  }
  ```

#### 4. Moderate Feedback
- **Method / Path**: `PATCH /v1/feedback/{feedback_id}`
- **Access**: Requires `feedback.publish` (`CONTENT_MANAGER`, `CLUB_ADMIN`, `SUPER_ADMIN`)
- **Request Body**:
  ```json
  {
    "moderation_status": "APPROVED",
    "visibility": "PUBLIC",
    "moderation_notes": "Insightful student testimonial approved for public display."
  }
  ```
- **Response**: `ApiResponse<FeedbackResponse>`

#### 5. Publish Feedback
- **Method / Path**: `POST /v1/feedback/{feedback_id}/publish`
- **Access**: Requires `feedback.publish`
- **Response**: `ApiResponse<FeedbackResponse>`
- **Error Codes**:
  - `400 BAD REQUEST`: If the student specified `publication_consent = 'NO'`.
