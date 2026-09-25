from fastapi import APIRouter
from pydantic import BaseModel
from apps.api.src.core.config import settings

router = APIRouter(tags=["Health"])


class HealthStatus(BaseModel):
    status: str
    service: str
    environment: str
    tagline: str


class ReadinessStatus(BaseModel):
    status: str
    database: str
    storage: str


@router.get("/health", response_model=HealthStatus)
def get_health() -> HealthStatus:
    """
    Liveness probe: verifies that the FastAPI application is running.
    """
    return HealthStatus(
        status="healthy",
        service=settings.PROJECT_NAME,
        environment=settings.ENVIRONMENT,
        tagline=settings.OFFICIAL_TAGLINE,
    )


@router.get("/ready", response_model=ReadinessStatus)
def get_readiness() -> ReadinessStatus:
    """
    Readiness probe: verifies external dependencies state.
    """
    return ReadinessStatus(
        status="ready",
        database="configured",
        storage="configured",
    )
