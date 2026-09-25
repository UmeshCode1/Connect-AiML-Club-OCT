from fastapi import APIRouter
from apps.api.src.api.v1.endpoints import health, auth, events, certificates

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(events.router)
api_router.include_router(certificates.router)
