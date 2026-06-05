from __future__ import annotations

import argparse
import asyncio
import json
import statistics
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.chat.chat_service import call_openai_chat


DEFAULT_CASES = [
    {
        "id": "medical_history",
        "question": "Tiền sử bệnh của bé như nào?",
        "expected_terms": ["hồ sơ", "tiền sử", "vaccine", "dị ứng", "cân nặng"],
    },
    {
        "id": "puppy_vaccine",
        "question": "Lịch tiêm phòng cơ bản cho chó con gồm những mũi nào?",
        "expected_terms": ["vaccine", "dại", "parvo", "nhắc"],
    },
    {
        "id": "vomiting_symptom",
        "question": "Bé bỏ ăn và nôn từ sáng, mình nên theo dõi dấu hiệu nào?",
        "expected_terms": ["nôn", "mất nước", "bác sĩ", "theo dõi"],
    },
    {
        "id": "nutrition",
        "question": "Poodle 11 tháng nên ăn khẩu phần như thế nào cho hợp lý?",
        "expected_terms": ["khẩu phần", "cân nặng", "protein", "bữa"],
    },
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Compare PetOmi chat responses with RAG enabled and disabled."
    )
    parser.add_argument("--user-id", required=True, help="Owner user UUID used by the chat pipeline.")
    parser.add_argument("--conversation-id", required=True, help="Conversation UUID used for recent-message context.")
    parser.add_argument("--pet-id", default=None, help="Optional pet UUID for pet profile and medical context.")
    parser.add_argument("--cases", type=Path, help="Optional JSON file containing benchmark cases.")
    parser.add_argument("--runs", type=int, default=1, help="Number of repeated runs per case and mode.")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=ROOT_DIR / "output" / "benchmarks",
        help="Directory for benchmark JSON and Markdown reports.",
    )
    return parser.parse_args()


def load_cases(path: Path | None) -> list[dict[str, Any]]:
    if path is None:
        return DEFAULT_CASES

    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise ValueError("Benchmark cases file must contain a JSON array.")

    cases: list[dict[str, Any]] = []
    for index, item in enumerate(data, start=1):
        if not isinstance(item, dict) or not str(item.get("question", "")).strip():
            raise ValueError(f"Case #{index} must contain a non-empty question.")
        cases.append(
            {
                "id": str(item.get("id") or f"case_{index}"),
                "question": str(item["question"]),
                "expected_terms": list(item.get("expected_terms") or []),
            }
        )
    return cases


def keyword_score(answer: str, expected_terms: list[str]) -> dict[str, Any]:
    if not expected_terms:
        return {"score": None, "matched_terms": []}

    lower_answer = answer.lower()
    matched = [term for term in expected_terms if term.lower() in lower_answer]
    return {
        "score": round(len(matched) / len(expected_terms), 3),
        "matched_terms": matched,
    }


async def run_single(
    *,
    case: dict[str, Any],
    mode: str,
    user_id: str,
    conversation_id: str,
    pet_id: str | None,
    run_index: int,
) -> dict[str, Any]:
    enable_rag = mode == "rag"
    started = time.perf_counter()
    try:
        result = await call_openai_chat(
            content=case["question"],
            user_id=user_id,
            conversation_id=conversation_id,
            pet_id=pet_id,
            enable_rag=enable_rag,
        )
        wall_latency_ms = int((time.perf_counter() - started) * 1000)
        score = keyword_score(result.get("response", ""), case.get("expected_terms", []))
        return {
            "case_id": case["id"],
            "run": run_index,
            "mode": mode,
            "ok": True,
            "question": case["question"],
            "response": result.get("response", ""),
            "intent": result.get("intent"),
            "urgency_level": result.get("urgency_level"),
            "routing_source": result.get("routing_source"),
            "model": result.get("model"),
            "rag_used": result.get("rag_used", False),
            "chunks_used": result.get("chunks_used", 0),
            "source_count": len(result.get("sources", []) or []),
            "tokens_input": result.get("tokens_input", 0),
            "tokens_output": result.get("tokens_output", 0),
            "reported_latency_ms": result.get("latency_ms"),
            "wall_latency_ms": wall_latency_ms,
            "keyword_score": score["score"],
            "matched_terms": score["matched_terms"],
            "sources": result.get("sources", []),
            "rag_query_used": result.get("rag_query_used"),
            "rag_rewrite_method": result.get("rag_rewrite_method"),
            "rag_error": result.get("rag_error"),
        }
    except Exception as exc:
        return {
            "case_id": case["id"],
            "run": run_index,
            "mode": mode,
            "ok": False,
            "question": case["question"],
            "error": str(exc),
            "wall_latency_ms": int((time.perf_counter() - started) * 1000),
        }


def summarize(results: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[tuple[str, str], list[dict[str, Any]]] = {}
    for result in results:
        grouped.setdefault((result["case_id"], result["mode"]), []).append(result)

    rows: list[dict[str, Any]] = []
    for (case_id, mode), items in sorted(grouped.items()):
        ok_items = [item for item in items if item.get("ok")]
        rows.append(
            {
                "case_id": case_id,
                "mode": mode,
                "runs": len(items),
                "ok_runs": len(ok_items),
                "avg_wall_latency_ms": _avg(ok_items, "wall_latency_ms"),
                "avg_tokens_input": _avg(ok_items, "tokens_input"),
                "avg_tokens_output": _avg(ok_items, "tokens_output"),
                "avg_chunks_used": _avg(ok_items, "chunks_used"),
                "avg_source_count": _avg(ok_items, "source_count"),
                "avg_keyword_score": _avg(ok_items, "keyword_score"),
            }
        )
    return rows


def _avg(items: list[dict[str, Any]], key: str) -> float | None:
    values = [item.get(key) for item in items if isinstance(item.get(key), (int, float))]
    if not values:
        return None
    return round(float(statistics.mean(values)), 2)


def write_reports(payload: dict[str, Any], output_dir: Path) -> tuple[Path, Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    json_path = output_dir / f"rag_benchmark_{stamp}.json"
    md_path = output_dir / f"rag_benchmark_{stamp}.md"

    json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    md_path.write_text(render_markdown(payload), encoding="utf-8")
    return json_path, md_path


def render_markdown(payload: dict[str, Any]) -> str:
    lines = [
        "# PetOmi RAG Benchmark",
        "",
        f"- Generated at: {payload['generated_at']}",
        f"- User ID: `{payload['inputs']['user_id']}`",
        f"- Conversation ID: `{payload['inputs']['conversation_id']}`",
        f"- Pet ID: `{payload['inputs'].get('pet_id') or 'none'}`",
        f"- Runs per case/mode: `{payload['inputs']['runs']}`",
        "",
        "## Summary",
        "",
        "| Case | Mode | OK | Latency ms | Input tokens | Output tokens | Chunks | Sources | Keyword score |",
        "|---|---:|---:|---:|---:|---:|---:|---:|---:|",
    ]

    for row in payload["summary"]:
        lines.append(
            "| {case_id} | {mode} | {ok_runs}/{runs} | {latency} | {tin} | {tout} | {chunks} | {sources} | {score} |".format(
                case_id=row["case_id"],
                mode=row["mode"],
                ok_runs=row["ok_runs"],
                runs=row["runs"],
                latency=_display(row["avg_wall_latency_ms"]),
                tin=_display(row["avg_tokens_input"]),
                tout=_display(row["avg_tokens_output"]),
                chunks=_display(row["avg_chunks_used"]),
                sources=_display(row["avg_source_count"]),
                score=_display(row["avg_keyword_score"]),
            )
        )

    lines.extend(["", "## Samples", ""])
    for result in payload["results"]:
        lines.extend(
            [
                f"### {result['case_id']} / {result['mode']} / run {result['run']}",
                "",
                f"Question: {result['question']}",
                "",
            ]
        )
        if result.get("ok"):
            lines.extend(
                [
                    f"- Intent: `{result.get('intent')}`",
                    f"- RAG used: `{result.get('rag_used')}`, chunks: `{result.get('chunks_used')}`, sources: `{result.get('source_count')}`",
                    f"- RAG query: `{result.get('rag_query_used') or '-'}`",
                    f"- RAG rewrite: `{result.get('rag_rewrite_method') or '-'}`",
                    f"- Latency: `{result.get('wall_latency_ms')}` ms",
                    f"- Keyword score: `{_display(result.get('keyword_score'))}`",
                    "",
                    result.get("response", "").strip(),
                    "",
                ]
            )
        else:
            lines.extend([f"Error: `{result.get('error')}`", ""])

    return "\n".join(lines)


def _display(value: Any) -> str:
    return "-" if value is None else str(value)


async def main() -> int:
    args = parse_args()
    if args.runs < 1:
        raise ValueError("--runs must be at least 1.")

    cases = load_cases(args.cases)
    results: list[dict[str, Any]] = []
    for case in cases:
        for run_index in range(1, args.runs + 1):
            results.append(
                await run_single(
                    case=case,
                    mode="no_rag",
                    user_id=args.user_id,
                    conversation_id=args.conversation_id,
                    pet_id=args.pet_id,
                    run_index=run_index,
                )
            )
            results.append(
                await run_single(
                    case=case,
                    mode="rag",
                    user_id=args.user_id,
                    conversation_id=args.conversation_id,
                    pet_id=args.pet_id,
                    run_index=run_index,
                )
            )

    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "inputs": {
            "user_id": args.user_id,
            "conversation_id": args.conversation_id,
            "pet_id": args.pet_id,
            "runs": args.runs,
            "cases_file": str(args.cases) if args.cases else None,
        },
        "cases": cases,
        "summary": summarize(results),
        "results": results,
    }

    json_path, md_path = write_reports(payload, args.output_dir)
    print(f"JSON report: {json_path}")
    print(f"Markdown report: {md_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
