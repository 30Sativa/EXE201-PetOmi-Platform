import argparse
import asyncio
import json
import sys
from pathlib import Path

from app.rag.web_crawler import (
    CrawledChunk,
    CrawledSource,
    crawl_merck_sections,
    write_crawl_result,
)

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Crawl veterinary knowledge for PetOmi RAG.")
    parser.add_argument(
        "--animals",
        nargs="+",
        default=["dog", "cat"],
        choices=["dog", "cat"],
        help="Animal owner sections to crawl.",
    )
    parser.add_argument(
        "--output-dir",
        default="output/crawl",
        help="Directory used for crawl JSON output.",
    )
    parser.add_argument(
        "--from-json",
        help="Skip crawling and ingest an existing all_sources.json file.",
    )
    parser.add_argument(
        "--ingest-db",
        action="store_true",
        help="Insert or update knowledge_sources and knowledge_chunks in PostgreSQL.",
    )
    parser.add_argument(
        "--skip-embeddings",
        action="store_true",
        help="Store chunks without calling the OpenAI embedding API.",
    )
    parser.add_argument(
        "--embedding-version",
        type=int,
        default=1,
        help="Embedding/chunking pipeline version stored in knowledge_chunks.",
    )
    return parser.parse_args()


def load_sources_from_json(path: Path) -> list[CrawledSource]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    raw_sources = payload["sources"] if isinstance(payload, dict) else payload

    sources: list[CrawledSource] = []
    for raw_source in raw_sources:
        chunks = [CrawledChunk(**raw_chunk) for raw_chunk in raw_source.get("chunks", [])]
        sources.append(
            CrawledSource(
                title=raw_source["title"],
                url=raw_source["url"],
                source_type=raw_source.get("source_type", "article"),
                content_hash=raw_source["content_hash"],
                metadata=raw_source.get("metadata", {}),
                chunks=chunks,
            )
        )
    return sources


async def run() -> None:
    args = parse_args()

    if args.from_json:
        sources = load_sources_from_json(Path(args.from_json))
        output_path = Path(args.from_json)
        elapsed_seconds = 0.0
    else:
        result = await crawl_merck_sections(animals=args.animals)
        sources = result.sources
        elapsed_seconds = result.elapsed_seconds
        output_path = write_crawl_result(result, Path(args.output_dir))

    print(
        "[INFO] Crawl output: "
        f"{output_path} | sources={len(sources)} | chunks={sum(len(source.chunks) for source in sources)} "
        f"| elapsed={elapsed_seconds:.1f}s"
    )

    if not args.ingest_db:
        return

    from app.database.connection import SessionLocal
    from app.rag.knowledge_ingestor import ingest_crawled_sources

    db = SessionLocal()
    try:
        stats = ingest_crawled_sources(
            db,
            sources,
            embed=not args.skip_embeddings,
            embedding_version=args.embedding_version,
        )
    finally:
        db.close()

    print(f"[INFO] DB ingest stats: {stats}")


if __name__ == "__main__":
    asyncio.run(run())
