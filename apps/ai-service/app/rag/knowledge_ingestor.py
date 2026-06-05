from sqlalchemy.orm import Session

from app.config import settings
from app.database.models import CrawlLogs, KnowledgeChunks, KnowledgeSources
from app.rag.web_crawler import CrawledSource, sha256_text


def log_crawl(db: Session, url: str, status: str, error: str | None = None) -> None:
    db.add(CrawlLogs(url=url, status=status, error=error))


def upsert_crawled_source(
    db: Session,
    source: CrawledSource,
    *,
    embed: bool = True,
    embedding_version: int = 1,
) -> tuple[KnowledgeSources, bool]:
    existing = (
        db.query(KnowledgeSources)
        .filter(KnowledgeSources.url == source.url)
        .one_or_none()
    )
    source_chunks = [
        (chunk, sha256_text(chunk.content))
        for chunk in source.chunks
    ]
    existing_chunks = []
    existing_by_index = {}
    reusable_embeddings_by_hash = {}

    if existing is not None:
        existing_chunks = (
            db.query(KnowledgeChunks)
            .filter(
                KnowledgeChunks.source_id == existing.id,
                KnowledgeChunks.embedding_version == embedding_version,
            )
            .all()
        )
        existing_by_index = {chunk.chunk_index: chunk for chunk in existing_chunks}
        reusable_embeddings_by_hash = {
            chunk.chunk_hash: chunk.embedding
            for chunk in existing_chunks
            if chunk.chunk_hash and chunk.embedding is not None
        }

    if existing and existing.content_hash == source.content_hash:
        chunks_are_complete = len(existing_chunks) == len(source_chunks) and all(
            chunk.chunk_index in existing_by_index
            and existing_by_index[chunk.chunk_index].chunk_hash == chunk_hash
            and (not embed or existing_by_index[chunk.chunk_index].embedding is not None)
            for chunk, chunk_hash in source_chunks
        )
        if chunks_are_complete:
            log_crawl(db, source.url, "skipped")
            return existing, False

    if existing is None:
        db_source = KnowledgeSources(
            title=source.title,
            source_type=source.source_type,
            url=source.url,
            content_hash=source.content_hash,
            chunk_count=len(source.chunks),
            metadata_=source.metadata,
            is_active=True,
        )
        db.add(db_source)
        db.flush()
    else:
        db_source = existing
        db_source.title = source.title
        db_source.source_type = source.source_type
        db_source.content_hash = source.content_hash
        db_source.chunk_count = len(source.chunks)
        db_source.metadata_ = source.metadata
        db_source.is_active = True

    if embed:
        from app.rag.embedder import embed_text
    else:
        embed_text = None

    current_indices = {chunk.chunk_index for chunk, _ in source_chunks}
    for old_chunk in existing_chunks:
        if old_chunk.chunk_index not in current_indices:
            db.delete(old_chunk)

    for chunk, chunk_hash in source_chunks:
        existing_chunk = existing_by_index.get(chunk.chunk_index)
        embedding = None

        if existing_chunk and existing_chunk.chunk_hash == chunk_hash:
            embedding = existing_chunk.embedding
        elif chunk_hash in reusable_embeddings_by_hash:
            embedding = reusable_embeddings_by_hash[chunk_hash]

        if embedding is None and embed_text:
            embedding = embed_text(chunk.content)

        if existing_chunk is None:
            db.add(
                KnowledgeChunks(
                    source_id=db_source.id,
                    chunk_index=chunk.chunk_index,
                    section_title=chunk.section_title,
                    chunk_hash=chunk_hash,
                    source_url=chunk.source_url,
                    content=chunk.content,
                    embedding=embedding,
                    embedding_model=settings.embedding_model,
                    embedding_version=embedding_version,
                    token_count=chunk.token_count,
                    metadata_=chunk.metadata,
                    is_active=True,
                )
            )
            continue

        existing_chunk.section_title = chunk.section_title
        existing_chunk.chunk_hash = chunk_hash
        existing_chunk.source_url = chunk.source_url
        existing_chunk.content = chunk.content
        existing_chunk.embedding = embedding
        existing_chunk.embedding_model = settings.embedding_model
        existing_chunk.embedding_version = embedding_version
        existing_chunk.token_count = chunk.token_count
        existing_chunk.metadata_ = chunk.metadata
        existing_chunk.is_active = True

    log_crawl(db, source.url, "success")
    return db_source, True


def ingest_crawled_sources(
    db: Session,
    sources: list[CrawledSource],
    *,
    embed: bool = True,
    embedding_version: int = 1,
) -> dict[str, int]:
    stats = {"inserted_or_updated": 0, "skipped": 0, "failed": 0, "chunks": 0}

    for source in sources:
        try:
            _, changed = upsert_crawled_source(
                db,
                source,
                embed=embed,
                embedding_version=embedding_version,
            )
            if changed:
                stats["inserted_or_updated"] += 1
                stats["chunks"] += len(source.chunks)
            else:
                stats["skipped"] += 1
            db.commit()
        except Exception as exc:
            db.rollback()
            log_crawl(db, source.url, "failed", str(exc))
            db.commit()
            stats["failed"] += 1
            print(f"[ERROR] Failed to ingest {source.url}: {exc}")

    return stats
