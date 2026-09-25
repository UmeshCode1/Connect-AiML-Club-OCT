from fastapi import APIRouter
from apps.api.src.api.v1.endpoints import (
    health,
    auth,
    events,
    certificates,
    sessions,
    attendance,
    volunteers,
    media,
    chronicle,
    journey,
    feedback,
)

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(events.router)
api_router.include_router(certificates.router)
api_router.include_router(sessions.router)
api_router.include_router(attendance.router)
api_router.include_router(volunteers.router)
api_router.include_router(media.router)
api_router.include_router(chronicle.router)
api_router.include_router(journey.router)
api_router.include_router(feedback.router)



