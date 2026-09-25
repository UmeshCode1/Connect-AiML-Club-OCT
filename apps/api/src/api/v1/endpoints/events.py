from typing import List
from fastapi import APIRouter
from apps.api.src.schemas.envelope import ApiResponse, ApiResponseMeta
from apps.api.src.schemas.events import EventResponse

router = APIRouter(prefix="/events", tags=["Events"])

# Initial baseline mock event representing the platform's canonical aggregate
SAMPLE_EVENTS: List[EventResponse] = [
    EventResponse(
        id="00000000-0000-0000-0000-000000000101",
        event_code="EVT-APTIFY-2026",
        slug="aptify-2026",
        title="Aptify 2.0: AI Symposium",
        short_description="Flagship AI symposium and workshop at Oriental College of Technology.",
        event_type="SYMPOSIUM",
        status="PLANNING",
        visibility="PUBLIC",
        venue="Auditorium, Oriental College of Technology, Bhopal",
        capacity=300,
        created_at="2026-09-25T00:00:00Z",
        updated_at="2026-09-25T00:00:00Z",
    )
]


@router.get("", response_model=ApiResponse[List[EventResponse]])
def list_events() -> ApiResponse[List[EventResponse]]:
    """
    Public listing of approved/published club events.
    """
    return ApiResponse(
        data=SAMPLE_EVENTS,
        meta=ApiResponseMeta(
            page=1,
            page_size=25,
            total=len(SAMPLE_EVENTS),
            has_next=False,
        ),
    )
