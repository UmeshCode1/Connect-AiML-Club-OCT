from typing import Generic, TypeVar, Optional, Any, List
from pydantic import BaseModel, Field

T = TypeVar("T")


class ApiResponseMeta(BaseModel):
    page: Optional[int] = None
    page_size: Optional[int] = None
    total: Optional[int] = None
    has_next: Optional[bool] = None
    request_id: Optional[str] = None
    timestamp: Optional[str] = None


class ApiResponse(BaseModel, Generic[T]):
    data: T
    meta: Optional[ApiResponseMeta] = Field(default_factory=ApiResponseMeta)
