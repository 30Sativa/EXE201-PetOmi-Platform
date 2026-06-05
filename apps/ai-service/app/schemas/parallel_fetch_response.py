from pydantic import BaseModel
from typing import Optional, Any


class SourceFetchResult(BaseModel):
    source: str
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None


class RagSearchResult(BaseModel):
    success: bool
    chunks: list[dict] = []
    error: Optional[str] = None
    query_used: Optional[str] = None


class ParallelFetchResponse(BaseModel):
    pet_basic_context: Optional[SourceFetchResult] = None
    pet_medical_summary: Optional[SourceFetchResult] = None
    conversation_recent_messages: Optional[SourceFetchResult] = None
    rag_search: Optional[RagSearchResult] = None

    all_success: bool
    total_duration_ms: int
    warnings: list[str] = []
