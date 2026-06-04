import asyncio
import gzip
import hashlib
import json
import re
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Iterable
from urllib.parse import urljoin, urlparse
import xml.etree.ElementTree as ET

import requests
from crawl4ai import (
    AsyncWebCrawler,
    BrowserConfig,
    CacheMode,
    CrawlerRunConfig,
    DefaultMarkdownGenerator,
    JsonCssExtractionStrategy,
)


MERCK_BASE_URL = "https://www.merckvetmanual.com"
MERCK_TOPIC_SITEMAP_URL = f"{MERCK_BASE_URL}/sitemaps/veterinary-topic.xml.gz"

DEFAULT_ANIMAL_SECTIONS = {
    "dog": f"{MERCK_BASE_URL}/dog-owners",
    "cat": f"{MERCK_BASE_URL}/cat-owners",
}

CRAWL_DELAY_SECONDS = 5.0
MAX_CONCURRENT_REQUESTS = 1
CHUNK_MIN_TOKENS = 50
CHUNK_MAX_TOKENS = 600


@dataclass(frozen=True)
class CrawledChunk:
    id: str
    content: str
    token_count: int
    section_title: str
    source_url: str
    chunk_index: int
    metadata: dict = field(default_factory=dict)


@dataclass(frozen=True)
class CrawledSource:
    title: str
    url: str
    source_type: str
    content_hash: str
    metadata: dict
    chunks: list[CrawledChunk]


@dataclass(frozen=True)
class CrawlResult:
    sources: list[CrawledSource]
    elapsed_seconds: float

    @property
    def chunk_count(self) -> int:
        return sum(len(source.chunks) for source in self.sources)


def estimate_tokens(text: str) -> int:
    return max(1, len(text) // 4)


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def safe_message(value: object) -> str:
    return str(value).encode("ascii", errors="replace").decode("ascii")


def slug_from_url(url: str) -> tuple[str, str]:
    path_parts = [part for part in urlparse(url).path.split("/") if part]
    topic = path_parts[-2] if len(path_parts) >= 2 else "unknown"
    article = path_parts[-1] if path_parts else "unknown"
    return topic, article


def split_by_headings(markdown: str) -> list[tuple[str, str]]:
    heading_pattern = re.compile(r"^(#{2,3})\s+(.+)$", re.MULTILINE)
    matches = list(heading_pattern.finditer(markdown))

    if not matches:
        return [("Introduction", markdown.strip())]

    sections: list[tuple[str, str]] = []
    intro = markdown[: matches[0].start()].strip()
    if intro:
        sections.append(("Introduction", intro))

    for index, match in enumerate(matches):
        title = match.group(2).strip()
        start = match.start()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(markdown)
        body = markdown[start:end].strip()
        if body:
            sections.append((title, body))

    return sections


def split_long_text(text: str, context_prefix: str) -> list[str]:
    paragraphs = [part.strip() for part in re.split(r"\n\s*\n", text) if part.strip()]
    if not paragraphs:
        return []

    chunks: list[str] = []
    current: list[str] = []

    def flush_current() -> None:
        if current:
            chunks.append("\n\n".join(current).strip())
            current.clear()

    for paragraph in paragraphs:
        candidate_parts = [*current, paragraph]
        candidate_text = f"{context_prefix}\n\n{'\n\n'.join(candidate_parts)}"

        if estimate_tokens(candidate_text) <= CHUNK_MAX_TOKENS:
            current.append(paragraph)
            continue

        flush_current()

        paragraph_text = f"{context_prefix}\n\n{paragraph}"
        if estimate_tokens(paragraph_text) <= CHUNK_MAX_TOKENS:
            current.append(paragraph)
            continue

        sentences = [part.strip() for part in re.split(r"(?<=[.!?])\s+", paragraph) if part.strip()]
        sentence_buffer: list[str] = []
        for sentence in sentences or [paragraph]:
            sentence_candidate = " ".join([*sentence_buffer, sentence]).strip()
            sentence_text = f"{context_prefix}\n\n{sentence_candidate}"
            if estimate_tokens(sentence_text) <= CHUNK_MAX_TOKENS:
                sentence_buffer.append(sentence)
            else:
                if sentence_buffer:
                    chunks.append(" ".join(sentence_buffer).strip())
                    sentence_buffer = [sentence]
                else:
                    chunks.append(sentence)

        if sentence_buffer:
            chunks.append(" ".join(sentence_buffer).strip())

    flush_current()
    return chunks


def extract_markdown_text(markdown: object) -> str:
    if isinstance(markdown, str):
        return markdown

    fit_markdown = getattr(markdown, "fit_markdown", None)
    if isinstance(fit_markdown, str) and fit_markdown.strip():
        return fit_markdown

    raw_markdown = getattr(markdown, "raw_markdown", None)
    if isinstance(raw_markdown, str) and raw_markdown.strip():
        return raw_markdown

    return str(markdown or "")


def extract_article_title(markdown: str, fallback_url: str) -> str:
    h1_match = re.search(r"^#\s+(.+)$", markdown, re.MULTILINE)
    if h1_match:
        return h1_match.group(1).strip()

    return urlparse(fallback_url).path.rstrip("/").split("/")[-1].replace("-", " ").title()


def make_source(markdown: str, url: str, animal: str, source_type: str = "article") -> CrawledSource:
    title = extract_article_title(markdown, url)
    topic, article = slug_from_url(url)
    sections = split_by_headings(markdown)
    chunks: list[CrawledChunk] = []
    chunk_index = 0

    for section_index, (heading, body) in enumerate(sections):
        body = body.strip()
        if not body:
            continue

        context = f"[{animal.upper()}] {title}"
        if heading != "Introduction":
            context = f"{context} > {heading}"

        for body_part in split_long_text(body, context):
            content = f"{context}\n\n{body_part}"
            token_count = estimate_tokens(content)

            if token_count < CHUNK_MIN_TOKENS:
                continue

            if token_count > CHUNK_MAX_TOKENS:
                print(f"[WARN] Long chunk ({token_count} tokens): {article} > {heading}")

            chunk_id = f"{animal}__{topic}__{article}__{chunk_index:03d}"
            chunks.append(
                CrawledChunk(
                    id=chunk_id,
                    content=content,
                    token_count=token_count,
                    section_title=heading,
                    source_url=url,
                    chunk_index=chunk_index,
                    metadata={
                        "animal": animal,
                        "topic": topic,
                        "article": article,
                        "article_title": title,
                        "section": heading,
                        "section_index": section_index,
                        "chunk_id": chunk_id,
                    },
                )
            )
            chunk_index += 1

    source_text = "\n\n".join(chunk.content for chunk in chunks) or markdown
    return CrawledSource(
        title=title,
        url=url,
        source_type=source_type,
        content_hash=sha256_text(source_text),
        metadata={
            "provider": "merck_vet_manual",
            "animal": animal,
            "topic": topic,
            "article": article,
        },
        chunks=chunks,
    )


def fetch_article_urls_from_sitemap(animal: str) -> list[str]:
    response = requests.get(MERCK_TOPIC_SITEMAP_URL, timeout=60)
    response.raise_for_status()

    content = response.content
    if content[:2] == b"\x1f\x8b":
        content = gzip.decompress(content)

    root = ET.fromstring(content)
    namespace = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    article_pattern = re.compile(rf"^/{animal}-owners/[^/#]+/[^/#]+/?$")
    seen: set[str] = set()
    urls: list[str] = []

    for loc in root.findall(".//sm:loc", namespace):
        if not loc.text:
            continue

        path = urlparse(loc.text).path.rstrip("/")
        if article_pattern.match(path) and path not in seen:
            seen.add(path)
            urls.append(urljoin(MERCK_BASE_URL, path))

    print(f"[INFO] Found {len(urls)} {animal} articles from sitemap")
    return urls


async def get_article_urls(crawler: AsyncWebCrawler, animal: str, toc_url: str) -> list[str]:
    try:
        sitemap_urls = fetch_article_urls_from_sitemap(animal)
        if sitemap_urls:
            return sitemap_urls
    except Exception as exc:
        print(f"[WARN] Sitemap discovery failed for {animal}: {safe_message(exc)}")

    schema = {
        "name": "article_links",
        "baseSelector": "a[href]",
        "fields": [
            {"name": "url", "selector": "self", "type": "attribute", "attribute": "href"},
            {"name": "title", "selector": "self", "type": "text"},
        ],
    }
    article_pattern = re.compile(rf"^/{animal}-owners/[^/#]+/[^/#]+/?$")

    result = await crawler.arun(
        url=toc_url,
        config=CrawlerRunConfig(
            cache_mode=CacheMode.BYPASS,
            extraction_strategy=JsonCssExtractionStrategy(schema),
            wait_for="css:a[href*='-owners']",
            excluded_tags=["script", "style"],
        ),
    )

    if not result.success:
        print(
            "[ERROR] Cannot crawl table of contents "
            f"{toc_url}: {safe_message(result.error_message)}"
        )
        return []

    if not result.extracted_content:
        print(f"[WARN] No links extracted from {toc_url}")
        return []

    links = json.loads(result.extracted_content)
    seen: set[str] = set()
    urls: list[str] = []
    for link in links:
        href = link.get("url", "")
        parsed_path = urlparse(href).path if href.startswith("http") else href
        parsed_path = parsed_path.rstrip("/")

        if article_pattern.match(parsed_path) and parsed_path not in seen:
            seen.add(parsed_path)
            urls.append(urljoin(MERCK_BASE_URL, parsed_path))

    print(f"[INFO] Found {len(urls)} {animal} articles from table of contents")
    return urls


async def crawl_article(crawler: AsyncWebCrawler, url: str, animal: str) -> CrawledSource | None:
    result = await crawler.arun(
        url=url,
        config=CrawlerRunConfig(
            cache_mode=CacheMode.BYPASS,
            css_selector="main, #mainContainer, article",
            excluded_tags=["nav", "footer", "header", "aside", "script", "style"],
            markdown_generator=DefaultMarkdownGenerator(
                options={
                    "ignore_links": True,
                    "ignore_images": True,
                    "body_width": 0,
                }
            ),
            wait_for="css:h1, h2",
            word_count_threshold=10,
            remove_overlay_elements=True,
        ),
    )

    if not result.success:
        print(f"[ERROR] {url}: {safe_message(result.error_message)}")
        return None

    markdown = extract_markdown_text(result.markdown)
    if not markdown.strip():
        print(f"[WARN] Empty markdown: {url}")
        return None

    source = make_source(markdown=markdown, url=url, animal=animal)
    print(f"[INFO] {urlparse(url).path.split('/')[-1]} -> {len(source.chunks)} chunks")
    return source


async def crawl_animal(crawler: AsyncWebCrawler, animal: str, toc_url: str) -> list[CrawledSource]:
    article_urls = await get_article_urls(crawler, animal, toc_url)
    if not article_urls:
        return []

    semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)

    async def crawl_with_limit(url: str) -> CrawledSource | None:
        async with semaphore:
            try:
                return await crawl_article(crawler, url, animal)
            except Exception as exc:
                print(f"[ERROR] {url}: {safe_message(exc)}")
                return None
            finally:
                await asyncio.sleep(CRAWL_DELAY_SECONDS)

    results = await asyncio.gather(*(crawl_with_limit(url) for url in article_urls))
    return [source for source in results if source is not None]


async def crawl_merck_sections(
    sections: dict[str, str] | None = None,
    animals: Iterable[str] | None = None,
) -> CrawlResult:
    start = time.time()
    selected_sections = sections or DEFAULT_ANIMAL_SECTIONS
    selected_animals = list(animals or selected_sections.keys())
    browser_config = BrowserConfig(
        browser_type="chromium",
        headless=True,
        viewport_width=1280,
        viewport_height=720,
    )

    all_sources: list[CrawledSource] = []
    async with AsyncWebCrawler(config=browser_config) as crawler:
        for animal in selected_animals:
            toc_url = selected_sections.get(animal)
            if not toc_url:
                print(f"[WARN] Unknown animal section: {animal}")
                continue

            print(f"[INFO] Crawling {animal}: {toc_url}")
            all_sources.extend(await crawl_animal(crawler, animal, toc_url))

    return CrawlResult(sources=all_sources, elapsed_seconds=time.time() - start)


def write_crawl_result(result: CrawlResult, output_dir: Path) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)

    for animal in DEFAULT_ANIMAL_SECTIONS:
        animal_sources = [
            source for source in result.sources if source.metadata.get("animal") == animal
        ]
        if animal_sources:
            animal_path = output_dir / f"{animal}_sources.json"
            animal_path.write_text(
                json.dumps([asdict(source) for source in animal_sources], ensure_ascii=False, indent=2),
                encoding="utf-8",
            )

    combined_path = output_dir / "all_sources.json"
    combined_path.write_text(
        json.dumps(
            {
                "elapsed_seconds": result.elapsed_seconds,
                "source_count": len(result.sources),
                "chunk_count": result.chunk_count,
                "sources": [asdict(source) for source in result.sources],
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    return combined_path
