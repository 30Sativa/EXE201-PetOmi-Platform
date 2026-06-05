from __future__ import annotations

import argparse
import asyncio
import json
import statistics
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.chat.chat_service import (
    _build_pet_context_from_payloads,
    _filter_chunks_by_pet_species,
    _rewrite_rag_query,
    _score_chunk_for_intent,
    _select_rag_chunks_for_prompt,
    classify_intent,
)
from app.context.pet_context_service import PetContext
from app.context.query_rewriter import _apply_template
from app.routing.intents import Intent
from app.services.parallel_fetch_service import (
    RAG_SIMILARITY_THRESHOLD,
    _search_knowledge_chunks_sync,
    parallel_fetch_all,
)


LEGACY_NUTRITION_TOPICS = [
    "selecting-and-providing-a-home-for-a-dog",
    "selecting-and-providing-a-home-for-a-cat",
]


DEFAULT_CASES: list[dict[str, Any]] = [
    {
        "id": "puppy_vaccine",
        "question": "What vaccines does a puppy need and when?",
        "expected_intent": "vaccine",
        "expected_sources": ["puppy-care", "routine-health-care-of-dogs"],
        "forbidden_sources": ["cat-owners", "british-shorthair"],
        "expected_terms": ["vaccine", "rabies", "parvovirus", "puppy"],
    },
    {
        "id": "vomiting_symptom",
        "question": "My dog is not eating and has been vomiting since morning. What signs should I monitor?",
        "expected_intent": "symptom",
        "expected_sources": ["vomiting-in-dogs", "digestive-disorders-of-dogs"],
        "forbidden_sources": ["cat-owners", "british-shorthair"],
        "expected_terms": ["vomiting", "dehydration", "diarrhea", "dog"],
    },
    {
        "id": "dog_nutrition",
        "question": "How much should an 11 month old Poodle eat per day?",
        "expected_intent": "nutrition",
        "expected_sources": ["puppy-care", "routine-care-of-dogs"],
        "forbidden_sources": [
            "cat-owners",
            "selecting-a-dog",
            "providing-a-home-for-a-dog",
            "dental-development-of-dogs",
        ],
        "expected_terms": ["puppy", "feed", "feeding", "nutrition", "food"],
    },
    {
        "id": "cat_nutrition",
        "question": "What should I feed a kitten and how many meals per day?",
        "expected_intent": "nutrition",
        "expected_sources": ["proper-nutrition-for-cats"],
        "forbidden_sources": ["dog-owners"],
        "expected_terms": ["cat", "food", "nutrition", "protein"],
        "pet_context": {"species": "cat", "age": "kitten"},
    },
]


@dataclass(frozen=True)
class Strategy:
    name: str
    query_mode: str
    top_k: int
    selector: str
    use_legacy_topic_filter: bool = False


STRATEGIES = [
    Strategy("original_top3_raw", "original", 3, "raw"),
    Strategy("legacy_topic_top3_raw", "original", 3, "raw", use_legacy_topic_filter=True),
    Strategy("template_top3_raw", "template", 3, "raw"),
    Strategy("template_top8_rerank3", "template", 8, "project_rerank"),
    Strategy("llm_top3_raw", "llm", 3, "raw"),
    Strategy("llm_top8_rerank3_current", "llm", 8, "project_rerank"),
    Strategy("llm_top12_rerank3", "llm", 12, "project_rerank"),
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Benchmark PetOmi routing, query rewriting, top-k, and chunk selection strategies."
    )
    parser.add_argument("--user-id", required=True)
    parser.add_argument("--conversation-id", required=True)
    parser.add_argument("--pet-id", default=None)
    parser.add_argument("--cases", type=Path)
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=ROOT_DIR / "output" / "benchmarks",
    )
    return parser.parse_args()


def load_cases(path: Path | None) -> list[dict[str, Any]]:
    if path is None:
        return DEFAULT_CASES
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError("Cases file must contain a JSON array.")
    return data


async def load_pet_context(
    user_id: str,
    conversation_id: str,
    pet_id: str | None,
) -> tuple[dict | None, dict | None, PetContext]:
    if not pet_id:
        return None, None, PetContext()

    fetch_result = await parallel_fetch_all(
        user_id=user_id,
        conversation_id=conversation_id,
        pet_id=pet_id,
        original_query="context fetch",
        rewritten_query=None,
        intent="general",
        enable_rag=False,
        defer_rag=True,
    )
    pet_profile = fetch_result.get("pet_basic_context")
    pet_medical = fetch_result.get("pet_medical_summary")
    pet_context = _build_pet_context_from_payloads(
        pet_id=pet_id,
        pet_type=None,
        pet_profile=pet_profile,
        pet_medical=pet_medical,
    )
    return pet_profile, pet_medical, pet_context


def override_pet_context(base_context: PetContext, case: dict[str, Any]) -> PetContext:
    override = case.get("pet_context")
    if not isinstance(override, dict):
        return base_context
    return PetContext(
        pet_id=base_context.pet_id,
        pet_name=override.get("pet_name") or base_context.pet_name,
        species=override.get("species") or base_context.species,
        breed=override.get("breed"),
        age=override.get("age"),
        age_months=override.get("age_months"),
        weight_kg=override.get("weight_kg"),
    )


def pet_profile_for_context(pet_context: PetContext) -> dict[str, Any]:
    return {
        "name": pet_context.pet_name,
        "species": pet_context.species,
        "breed": pet_context.breed,
        "ageFormatted": pet_context.age,
        "ageMonths": pet_context.age_months,
    }


async def build_query(case: dict[str, Any], strategy: Strategy, pet_context: PetContext) -> tuple[str, str]:
    question = case["question"]
    intent = Intent(case["expected_intent"])

    if strategy.query_mode == "original":
        return question, "original"
    if strategy.query_mode == "template":
        return _apply_template(question, intent, pet_context), "template"
    if strategy.query_mode == "llm":
        return _rewrite_rag_query(question, intent, pet_context)

    raise ValueError(f"Unsupported query mode: {strategy.query_mode}")


def run_search(
    query: str,
    case: dict[str, Any],
    strategy: Strategy,
) -> tuple[list[dict], int]:
    metadata_filter = None
    if strategy.use_legacy_topic_filter and case["expected_intent"] == "nutrition":
        metadata_filter = {"topic": LEGACY_NUTRITION_TOPICS}

    started = time.perf_counter()
    chunks = _search_knowledge_chunks_sync(
        query=query,
        top_k=strategy.top_k,
        similarity_threshold=RAG_SIMILARITY_THRESHOLD,
        metadata_filter=metadata_filter,
    )
    elapsed_ms = int((time.perf_counter() - started) * 1000)
    return chunks, elapsed_ms


def select_chunks(
    chunks: list[dict],
    case: dict[str, Any],
    strategy: Strategy,
    pet_context: PetContext,
) -> list[dict]:
    pet_profile = pet_profile_for_context(pet_context)
    if strategy.selector == "raw":
        return _filter_chunks_by_pet_species(chunks, pet_profile)[:3]
    if strategy.selector == "project_rerank":
        return _select_rag_chunks_for_prompt(
            chunks,
            case["expected_intent"],
            pet_profile,
            limit=3,
        )
    raise ValueError(f"Unsupported selector: {strategy.selector}")


def evaluate_chunks(chunks: list[dict], case: dict[str, Any]) -> dict[str, Any]:
    haystacks = [
        " ".join(
            str(part or "").lower()
            for part in (
                chunk.get("source_title"),
                chunk.get("source_url"),
                chunk.get("content"),
            )
        )
        for chunk in chunks
    ]
    combined = "\n".join(haystacks)

    expected_sources = [term.lower() for term in case.get("expected_sources", [])]
    forbidden_sources = [term.lower() for term in case.get("forbidden_sources", [])]
    expected_terms = [term.lower() for term in case.get("expected_terms", [])]

    source_hits = [term for term in expected_sources if term in combined]
    forbidden_hits = [term for term in forbidden_sources if term in combined]
    term_hits = [term for term in expected_terms if term in combined]

    source_score = 1.0 if source_hits else 0.0
    forbidden_score = 1.0 if not forbidden_hits else 0.0
    term_score = len(term_hits) / len(expected_terms) if expected_terms else 1.0
    chunk_score = round((source_score * 0.45) + (forbidden_score * 0.35) + (term_score * 0.20), 3)

    return {
        "chunk_score": chunk_score,
        "source_hits": source_hits,
        "forbidden_hits": forbidden_hits,
        "term_hits": term_hits,
        "term_score": round(term_score, 3),
    }


async def benchmark_routing(cases: list[dict[str, Any]], pet_id: str | None) -> list[dict[str, Any]]:
    rows = []
    for case in cases:
        started = time.perf_counter()
        result = await classify_intent(case["question"], pet_id=pet_id)
        elapsed_ms = int((time.perf_counter() - started) * 1000)
        rows.append(
            {
                "case_id": case["id"],
                "question": case["question"],
                "expected_intent": case["expected_intent"],
                "actual_intent": result["intent"],
                "intent_ok": result["intent"] == case["expected_intent"],
                "urgency_level": result["urgency_level"],
                "routing_source": result["routing_source"],
                "latency_ms": elapsed_ms,
            }
        )
    return rows


async def benchmark_retrieval(
    cases: list[dict[str, Any]],
    base_pet_context: PetContext,
) -> list[dict[str, Any]]:
    rows = []
    query_cache: dict[tuple[str, str], tuple[str, str]] = {}

    for case in cases:
        case_context = override_pet_context(base_pet_context, case)
        for strategy in STRATEGIES:
            query_key = (case["id"], strategy.query_mode)
            if query_key not in query_cache:
                query_cache[query_key] = await build_query(case, strategy, case_context)
            query, rewrite_method = query_cache[query_key]

            raw_chunks, search_latency_ms = run_search(query, case, strategy)
            selected_chunks = select_chunks(raw_chunks, case, strategy, case_context)
            evaluation = evaluate_chunks(selected_chunks, case)
            rows.append(
                {
                    "case_id": case["id"],
                    "strategy": strategy.name,
                    "query_mode": strategy.query_mode,
                    "rewrite_method": rewrite_method,
                    "query": query,
                    "top_k": strategy.top_k,
                    "selector": strategy.selector,
                    "raw_chunk_count": len(raw_chunks),
                    "selected_chunk_count": len(selected_chunks),
                    "search_latency_ms": search_latency_ms,
                    **evaluation,
                    "selected_sources": [
                        {
                            "title": chunk.get("source_title"),
                            "url": chunk.get("source_url"),
                            "similarity": chunk.get("similarity"),
                            "intent_score": round(_score_chunk_for_intent(chunk, case["expected_intent"]), 3),
                        }
                        for chunk in selected_chunks
                    ],
                }
            )
    return rows


def summarize_retrieval(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, list[dict[str, Any]]] = {}
    for row in rows:
        grouped.setdefault(row["strategy"], []).append(row)

    summary = []
    for strategy, items in sorted(grouped.items()):
        scores = [item["chunk_score"] for item in items]
        forbidden_cases = sum(1 for item in items if item["forbidden_hits"])
        empty_cases = sum(1 for item in items if item["selected_chunk_count"] == 0)
        summary.append(
            {
                "strategy": strategy,
                "avg_chunk_score": round(float(statistics.mean(scores)), 3),
                "min_chunk_score": round(float(min(scores)), 3),
                "forbidden_cases": forbidden_cases,
                "empty_cases": empty_cases,
                "avg_search_latency_ms": _avg(items, "search_latency_ms"),
            }
        )
    return summary


def _avg(items: list[dict[str, Any]], key: str) -> float | None:
    values = [item.get(key) for item in items if isinstance(item.get(key), (int, float))]
    if not values:
        return None
    return round(float(statistics.mean(values)), 2)


def write_reports(payload: dict[str, Any], output_dir: Path) -> tuple[Path, Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    json_path = output_dir / f"rag_strategy_benchmark_{stamp}.json"
    md_path = output_dir / f"rag_strategy_benchmark_{stamp}.md"
    json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    md_path.write_text(render_markdown(payload), encoding="utf-8")
    return json_path, md_path


def render_markdown(payload: dict[str, Any]) -> str:
    lines = [
        "# PetOmi RAG Strategy Benchmark",
        "",
        f"- Generated at: {payload['generated_at']}",
        f"- User ID: `{payload['inputs']['user_id']}`",
        f"- Conversation ID: `{payload['inputs']['conversation_id']}`",
        f"- Pet ID: `{payload['inputs'].get('pet_id') or 'none'}`",
        "",
        "## Routing",
        "",
        "| Case | Expected | Actual | OK | Source | Latency ms |",
        "|---|---:|---:|---:|---:|---:|",
    ]
    for row in payload["routing"]:
        lines.append(
            f"| {row['case_id']} | {row['expected_intent']} | {row['actual_intent']} | {row['intent_ok']} | {row['routing_source']} | {row['latency_ms']} |"
        )

    lines.extend(
        [
            "",
            "## Retrieval Summary",
            "",
            "| Strategy | Avg score | Min score | Forbidden cases | Empty cases | Avg search ms |",
            "|---|---:|---:|---:|---:|---:|",
        ]
    )
    for row in payload["retrieval_summary"]:
        lines.append(
            f"| {row['strategy']} | {row['avg_chunk_score']} | {row['min_chunk_score']} | {row['forbidden_cases']} | {row['empty_cases']} | {row['avg_search_latency_ms']} |"
        )

    lines.extend(["", "## Retrieval Details", ""])
    for row in payload["retrieval"]:
        lines.extend(
            [
                f"### {row['case_id']} / {row['strategy']}",
                "",
                f"- Query: `{row['query']}`",
                f"- Rewrite: `{row['rewrite_method']}`",
                f"- Score: `{row['chunk_score']}`",
                f"- Forbidden hits: `{', '.join(row['forbidden_hits']) or '-'}`",
                f"- Term hits: `{', '.join(row['term_hits']) or '-'}`",
                "",
            ]
        )
        for source in row["selected_sources"]:
            lines.append(
                f"- {source['title']} ({source['similarity']:.3f}, intent_score={source['intent_score']}): {source['url']}"
            )
        lines.append("")
    return "\n".join(lines)


async def main() -> int:
    args = parse_args()
    cases = load_cases(args.cases)
    _, _, pet_context = await load_pet_context(args.user_id, args.conversation_id, args.pet_id)
    routing = await benchmark_routing(cases, args.pet_id)
    retrieval = await benchmark_retrieval(cases, pet_context)
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "inputs": {
            "user_id": args.user_id,
            "conversation_id": args.conversation_id,
            "pet_id": args.pet_id,
            "cases_file": str(args.cases) if args.cases else None,
        },
        "routing": routing,
        "retrieval_summary": summarize_retrieval(retrieval),
        "retrieval": retrieval,
    }
    json_path, md_path = write_reports(payload, args.output_dir)
    print(f"JSON report: {json_path}")
    print(f"Markdown report: {md_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
