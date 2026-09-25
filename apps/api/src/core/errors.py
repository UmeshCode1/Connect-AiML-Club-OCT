from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import uuid


class ConnectAPIException(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class PermissionDeniedException(ConnectAPIException):
    def __init__(self, message: str = "You do not have permission to perform this action."):
        super().__init__(code="PERMISSION_DENIED", message=message, status_code=403)


class NotFoundException(ConnectAPIException):
    def __init__(self, message: str = "The requested resource was not found."):
        super().__init__(code="NOT_FOUND", message=message, status_code=404)


class UnauthorizedException(ConnectAPIException):
    def __init__(self, message: str = "Authentication required."):
        super().__init__(code="UNAUTHORIZED", message=message, status_code=401)


class BadRequestException(ConnectAPIException):
    def __init__(self, message: str = "Invalid request payload."):
        super().__init__(code="BAD_REQUEST", message=message, status_code=400)


class ConflictException(ConnectAPIException):
    def __init__(self, message: str = "Resource conflict occurred."):
        super().__init__(code="CONFLICT", message=message, status_code=409)



async def connect_exception_handler(request: Request, exc: ConnectAPIException) -> JSONResponse:
    request_id = getattr(request.state, "request_id", f"req_{uuid.uuid4().hex[:12]}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "request_id": request_id,
            }
        },
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    request_id = getattr(request.state, "request_id", f"req_{uuid.uuid4().hex[:12]}")
    # Extract first validation issue without leaking raw traceback
    first_error = exc.errors()[0] if exc.errors() else {"msg": "Validation failed"}
    msg = f"{first_error.get('loc', ['request'])[-1]}: {first_error.get('msg', 'Invalid input')}"
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": msg,
                "request_id": request_id,
            }
        },
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    request_id = getattr(request.state, "request_id", f"req_{uuid.uuid4().hex[:12]}")
    code_map = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "PERMISSION_DENIED",
        404: "NOT_FOUND",
        409: "CONFLICT",
        422: "VALIDATION_ERROR",
        500: "INTERNAL_SERVER_ERROR",
    }
    code = code_map.get(exc.status_code, "HTTP_ERROR")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": code,
                "message": str(exc.detail),
                "request_id": request_id,
            }
        },
    )

