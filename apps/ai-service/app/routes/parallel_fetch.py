import asyncio
import logging

from fastapi import APIRouter, HTTPException, status

from app.schemas.parallel_fetch import ParallelFetchRequest
from app.schemas.parallel_fetch_response import ParallelFetchResponse, SourceFetchResult, RagSearchResult
from app.services.parallel_fetch_service import parallel_fetch_all

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/internal/ai",
    tags=["Pet AI - Internal"]
)


@router.post("/parallel-fetch", response_model=ParallelFetchResponse)
async def parallel_fetch(request: ParallelFetchRequest):
    """
    Parallel fetching endpoint for AI context building.

    Fetches 4 data sources concurrently:
      1. Pet basic context from .NET API
      2. Pet medical summary from .NET API
      3. Recent conversation messages from .NET API
      4. RAG vector search from PostgreSQL (using rewritten query)

    HTTP context tasks have a 5-second timeout; RAG search uses its own
    longer timeout because embedding + vector search can take longer.
    """
    try:
        result = await asyncio.wait_for(
            _do_parallel_fetch(request),
            timeout=30.0,
        )
        return ParallelFetchResponse(
            pet_basic_context=_wrap_source_result(result.get("pet_basic_context")),
            pet_medical_summary=_wrap_source_result(result.get("pet_medical_summary")),
            conversation_recent_messages=_wrap_source_result(result.get("conversation_recent_messages")),
            rag_search=_wrap_rag_result(result.get("rag_search")),
            all_success=result.get("all_success", False),
            total_duration_ms=result.get("total_duration_ms", 0),
            warnings=result.get("warnings", []),
        )

    except asyncio.TimeoutError:
        logger.error("Parallel fetch timed out after 30s for user %s, conversation %s",
                      request.user_id, request.conversation_id)
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Parallel fetch timed out after 30 seconds.",
        )
    except Exception as e:
        logger.error("Parallel fetch error for user %s, conversation %s: %s",
                     request.user_id, request.conversation_id, str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Parallel fetch failed: {str(e)}",
        )


async def _do_parallel_fetch(request: ParallelFetchRequest) -> dict:
    return await parallel_fetch_all(
        user_id=request.user_id,
        conversation_id=request.conversation_id,
        pet_id=request.pet_id,
        original_query=request.original_query,
        rewritten_query=request.rewritten_query,
        intent=request.intent,
    )


def _wrap_source_result(raw: dict | None) -> SourceFetchResult | None:
    if raw is None:
        return None
    return SourceFetchResult(
        source=raw.get("source", ""),
        success=raw.get("success", False),
        data=raw.get("data"),
        error=raw.get("error"),
    )


def _wrap_rag_result(raw: dict | None) -> RagSearchResult | None:
    if raw is None:
        return None
    return RagSearchResult(
        success=raw.get("success", False),
        chunks=raw.get("chunks", []),
        error=raw.get("error"),
        query_used=raw.get("query_used"),
    )
