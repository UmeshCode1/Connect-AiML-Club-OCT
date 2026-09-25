import time
import uuid
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.middleware.cors import CORSMiddleware
from apps.api.src.core.config import settings
from apps.api.src.core.logging import logger
from apps.api.src.core.errors import (
    ConnectAPIException,
    connect_exception_handler,
    validation_exception_handler,
    http_exception_handler,
)
from apps.api.src.api.v1.router import api_router
from apps.api.src.api.v1.endpoints.health import router as health_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Official API for AIML Club OCT — Connect. Tagline: 'Innovate. Implement. Inspire.'",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Exception handlers ensuring consistent { error: { code, message, request_id } } envelope
app.add_exception_handler(ConnectAPIException, connect_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_process_time_request_id_and_security_headers(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", f"req_{uuid.uuid4().hex[:12]}")
    request.state.request_id = request_id
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    
    # Defensive Security Headers per 11_SECURITY_PRIVACY.md
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    return response


# Include routers
app.include_router(health_router)  # /health and /ready at top level
app.include_router(api_router, prefix=settings.API_V1_PREFIX)  # /v1 routes


@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "tagline": settings.OFFICIAL_TAGLINE,
        "organization": "AI & Machine Learning Club, Oriental College of Technology, Bhopal",
        "version": "1.0.0",
        "documentation": "/docs",
        "health": "/health",
        "v1": settings.API_V1_PREFIX,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("apps.api.src.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
