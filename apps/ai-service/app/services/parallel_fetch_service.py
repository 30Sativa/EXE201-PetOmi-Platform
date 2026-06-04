import asyncio
import logging
import time
from typing import Optional

import httpx

from app.config import settings
from app.rag.embedder import embed_text
from app.database.connection import SessionLocal
from sqlalchemy import text

logger = logging.getLogger(__name__)

FETCH_TIMEOUT_SECONDS = 5.0
RAG_SEARCH_TIMEOUT_SECONDS = 15.0
RAG_SIMILARITY_THRESHOLD = 0.35
IVFFLAT_PROBES = 10


async def fetch_dotnet_endpoint(
    url: str,
    api_key: str,
) -> tuple[str, Optional[dict], Optional[str]]:
    headers = {"X-Api-Key": api_key}
    try:
        async with httpx.AsyncClient(timeout=FETCH_TIMEOUT_SECONDS) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                return url, resp.json(), None
            if resp.status_code == 404:
                return url, None, f"404 Not Found: {url}"
            return url, None, f"HTTP {resp.status_code}: {resp.text[:200]}"
    except httpx.TimeoutException:
        return url, None, f"Timeout after {FETCH_TIMEOUT_SECONDS}s"
    except Exception as e:
        return url, None, f"Exception: {str(e)}"


async def fetch_pet_basic_context(
    pet_id: str,
    api_key: str,
    base_url: str,
) -> tuple[str, Optional[dict], Optional[str]]:
    url = f"{base_url}/internal/ai/pets/{pet_id}/basic-context"
    return await fetch_dotnet_endpoint(url, api_key)


async def fetch_pet_medical_summary(
    pet_id: str,
    api_key: str,
    base_url: str,
) -> tuple[str, Optional[dict], Optional[str]]:
    url = f"{base_url}/internal/ai/pets/{pet_id}/medical-summary"
    return await fetch_dotnet_endpoint(url, api_key)


async def fetch_conversation_recent_messages(
    conversation_id: str,
    api_key: str,
    base_url: str,
    take: int = 20,
) -> tuple[str, Optional[dict], Optional[str]]:
    url = f"{base_url}/internal/ai/conversations/{conversation_id}/recent-messages?take={take}"
    return await fetch_dotnet_endpoint(url, api_key)


async def search_rag_with_timeout(
    query: str,
    metadata_filter: Optional[dict] = None,
    top_k: int = 3,
    similarity_threshold: float = RAG_SIMILARITY_THRESHOLD,
) -> tuple[str, list[dict], Optional[str]]:
    try:
        chunks = await asyncio.wait_for(
            asyncio.to_thread(
                _search_knowledge_chunks_sync,
                query=query,
                top_k=top_k,
                similarity_threshold=similarity_threshold,
                metadata_filter=metadata_filter,
            ),
            timeout=RAG_SEARCH_TIMEOUT_SECONDS,
        )
        return query, chunks, None
    except asyncio.TimeoutError:
        return query, [], f"Timeout after {RAG_SEARCH_TIMEOUT_SECONDS}s"
    except Exception as e:
        return query, [], f"RAG search error: {str(e)}"


def _search_knowledge_chunks_sync(
    query: str,
    top_k: int,
    similarity_threshold: float,
    metadata_filter: Optional[dict] = None,
    embedding_model: Optional[str] = None,
    embedding_version: int = 1,
) -> list[dict]:
    embedding_model = embedding_model or settings.embedding_model
    query_embedding = embed_text(query)

    filter_part = ""
    if metadata_filter:
        for key, val in metadata_filter.items():
            escaped_key = str(key).replace("'", "''")
            if isinstance(val, list):
                escaped_values = [str(v).replace("'", "''") for v in val]
                quoted_values = ", ".join(f"'{v}'" for v in escaped_values)
                filter_part += f" AND kc.metadata->>'{escaped_key}' IN ({quoted_values})"
            else:
                escaped_val = str(val).replace("'", "''")
                filter_part += f" AND kc.metadata->>'{escaped_key}' = '{escaped_val}'"

    query_vec = "[" + ",".join(str(x) for x in query_embedding) + "]"

    sql = f"""
        SELECT
            kc.id,
            kc.content,
            kc.metadata,
            ks.title as source_title,
            ks.url as source_url,
            1 - (kc.embedding <=> CAST(:query_vec AS vector)) AS similarity
        FROM knowledge_chunks kc
        JOIN knowledge_sources ks ON ks.id = kc.source_id
        WHERE
            kc.is_active = true
            AND kc.embedding IS NOT NULL
            AND kc.embedding_model = '{embedding_model}'
            AND kc.embedding_version = {embedding_version}
            AND 1 - (kc.embedding <=> CAST(:query_vec AS vector)) > :similarity_threshold
            {filter_part}
        ORDER BY kc.embedding <=> CAST(:query_vec AS vector)
        LIMIT {top_k};
    """

    db = SessionLocal()
    try:
        db.execute(text(f"SET ivfflat.probes = {IVFFLAT_PROBES}"))
        result = db.execute(
            text(sql),
            {
                "query_vec": query_vec,
                "similarity_threshold": similarity_threshold,
            },
        )
        rows = result.fetchall()

        chunks = []
        for row in rows:
            chunks.append({
                "id": str(row.id),
                "content": row.content,
                "metadata": row.metadata,
                "source_title": row.source_title,
                "source_url": row.source_url,
                "similarity": float(row.similarity),
            })
        return chunks
    finally:
        db.close()


async def _run_with_timeout(name: str, coro, timeout_seconds: float = FETCH_TIMEOUT_SECONDS):
    try:
        return name, await asyncio.wait_for(coro, timeout=timeout_seconds)
    except asyncio.TimeoutError:
        logger.warning("parallel_fetch task %s timed out after %.1fs", name, timeout_seconds)
        return name, None
    except Exception as e:
        logger.warning("parallel_fetch task %s failed: %s", name, e)
        return name, e


async def parallel_fetch_all(
    user_id: str,
    conversation_id: str,
    pet_id: Optional[str],
    original_query: str,
    rewritten_query: Optional[str],
    intent: Optional[str],
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
    rag_topics: Optional[list[str]] = None,
    enable_rag: bool = True,
    defer_rag: bool = False,
) -> dict:
    start_time = time.time()
    warnings: list[str] = []

    _api_key = api_key or settings.ai_service_api_key or settings.dotnet_api_webhook_secret or ""
    _base_url = (base_url or settings.dotnet_api_base_url).rstrip("/")

    if not _api_key:
        logger.warning("AI_SERVICE_API_KEY not configured for parallel fetch")

    rag_query = rewritten_query if rewritten_query else original_query

    metadata_filter: dict = {}
    if rag_topics:
        metadata_filter = {"topic": rag_topics}

    tasks = {}

    if pet_id:
        tasks["pet_basic_context"] = fetch_pet_basic_context(pet_id, _api_key, _base_url)
        tasks["pet_medical_summary"] = fetch_pet_medical_summary(pet_id, _api_key, _base_url)

    tasks["conversation_recent_messages"] = (
        fetch_conversation_recent_messages(conversation_id, _api_key, _base_url, take=20)
    )

    if enable_rag and not defer_rag:
        tasks["rag_search"] = (
            search_rag_with_timeout(
                query=rag_query,
                metadata_filter=metadata_filter if metadata_filter else None,
                top_k=3,
                similarity_threshold=RAG_SIMILARITY_THRESHOLD,
            )
        )
    elif not enable_rag:
        warnings.append("RAG search disabled for this run.")

    gathered = await asyncio.gather(
        *(
            _run_with_timeout(
                name,
                coro,
                RAG_SEARCH_TIMEOUT_SECONDS if name == "rag_search" else FETCH_TIMEOUT_SECONDS,
            )
            for name, coro in tasks.items()
        ),
        return_exceptions=False,
    )
    gathered_results = dict(gathered)

    results = {}

    for name in tasks:
        task_result = gathered_results.get(name)
        if name == "rag_search":
            if isinstance(task_result, Exception):
                chunks, err, query_used = [], f"Exception: {str(task_result)}", rag_query
            elif task_result is None:
                chunks, err, query_used = [], f"Timeout after {RAG_SEARCH_TIMEOUT_SECONDS}s", rag_query
            else:
                query_used, chunks, err = task_result
            results[name] = {
                "source": name,
                "success": err is None,
                "chunks": chunks,
                "query_used": query_used,
                "error": err,
            }
            if err:
                warnings.append(f"RAG search failed: {err}")
        else:
            if isinstance(task_result, Exception):
                url, data, err = "", None, f"Exception: {str(task_result)}"
            elif task_result is None:
                url, data, err = "", None, f"Timeout after {FETCH_TIMEOUT_SECONDS}s"
            else:
                url, data, err = task_result
            results[name] = {
                "source": name,
                "success": err is None,
                "data": data,
                "error": err,
            }
            if err:
                warnings.append(f"{name} failed: {err}")

    elapsed_ms = int((time.time() - start_time) * 1000)

    all_success = all(r.get("success", False) for r in results.values())

    logger.info(
        "parallel_fetch completed in %dms. PetId=%s ConvId=%s Success=%s Warnings=%s",
        elapsed_ms,
        pet_id,
        conversation_id,
        all_success,
        len(warnings),
    )

    return {
        "pet_basic_context": results.get("pet_basic_context"),
        "pet_medical_summary": results.get("pet_medical_summary"),
        "conversation_recent_messages": results.get("conversation_recent_messages"),
        "rag_search": results.get("rag_search"),
        "all_success": all_success,
        "total_duration_ms": elapsed_ms,
        "warnings": warnings,
    }
