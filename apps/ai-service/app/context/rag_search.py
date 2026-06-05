import logging
from typing import Optional

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.database.connection import SessionLocal
from app.rag.embedder import embed_text

logger = logging.getLogger(__name__)


def _build_match_chunks_query(
    query_embedding: list[float],
    match_threshold: float,
    match_count: int,
    filter_metadata: Optional[dict] = None,
    embedding_model: str = "bge-base-en-v1.5",
    embedding_version: int = 1,
) -> str:
    filter_part = ""
    if filter_metadata:
        for key, val in filter_metadata.items():
            escaped_val = str(val).replace("'", "''")
            filter_part += f" AND metadata->>'{key}' = '{escaped_val}'"

    query_vec = "[" + ",".join(str(x) for x in query_embedding) + "]"

    return f"""
        SELECT
            kc.id,
            kc.content,
            kc.metadata,
            ks.title as source_title,
            ks.url as source_url,
            1 - (kc.embedding <=> '{query_vec}'::vector) AS similarity
        FROM knowledge_chunks kc
        JOIN knowledge_sources ks ON ks.id = kc.source_id
        WHERE
            kc.is_active = true
            AND kc.embedding IS NOT NULL
            AND kc.embedding_model = '{embedding_model}'
            AND kc.embedding_version = {embedding_version}
            AND 1 - (kc.embedding <=> '{query_vec}'::vector) > {match_threshold}
            {filter_part}
        ORDER BY similarity DESC
        LIMIT {match_count};
    """


async def search_knowledge_chunks(
    query: str,
    top_k: int = 3,
    similarity_threshold: float = 0.75,
    metadata_filter: Optional[dict] = None,
) -> list[dict]:
    try:
        query_embedding = embed_text(query)
    except Exception as e:
        logger.warning("Failed to embed query for RAG search: %s", e)
        return []

    sql = _build_match_chunks_query(
        query_embedding=query_embedding,
        match_threshold=similarity_threshold,
        match_count=top_k,
        filter_metadata=metadata_filter,
    )

    db: Session = SessionLocal()
    try:
        result = db.execute(text(sql))
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

        logger.info(
            "RAG search for query='%s...': found=%d chunks above threshold %.2f",
            query[:30],
            len(chunks),
            similarity_threshold,
        )
        return chunks

    except Exception as e:
        logger.error("RAG search failed: %s", e)
        return []
    finally:
        db.close()


async def search_knowledge_chunks_for_test(
    query: str,
    top_k: int = 3,
    similarity_threshold: float = 0.75,
    metadata_filter: Optional[dict] = None,
) -> list[dict]:
    return await search_knowledge_chunks(
        query=query,
        top_k=top_k,
        similarity_threshold=similarity_threshold,
        metadata_filter=metadata_filter,
    )
