import logging
import re
import time
import unicodedata
from typing import Optional

import httpx
from openai import OpenAI

from app.config import settings
from app.schemas.request import ChatProcessRequest
from app.schemas.response import AiWebhookPayload
from app.routing import HybridRouter, RoutingContext
from app.routing.intents import Intent
from app.context import (
    DataSourceMap,
    PetContext,
    query_rewriter,
)
from app.services.parallel_fetch_service import parallel_fetch_all, search_rag_with_timeout

logger = logging.getLogger(__name__)

if not settings.openai_api_key:
    raise ValueError("OPENAI_API_KEY is not configured.")

openai_client = OpenAI(api_key=settings.openai_api_key)
hybrid_router = HybridRouter()

LLM_PRIMARY_MODEL = "gpt-4o"
LLM_PRIMARY_MAX_TOKENS = 4000

# Token budget (gpt-4o context ~128k tokens, reserve ~500 for completion overhead)
BUDGET_SYSTEM = 1000
BUDGET_USER_MSG = 500
BUDGET_RESERVED = 500
BUDGET_CHUNKS = 6000  # main allocation for context chunks
RAG_CANDIDATE_CHUNKS = 8
RAG_PROMPT_CHUNKS = 3

_INTENT_CHUNK_TERMS: dict[str, tuple[str, ...]] = {
    "nutrition": (
        "nutrition", "nutrient", "food", "feed", "feeding", "diet", "meal",
        "protein", "calorie", "calories", "portion", "weight", "puppy",
        "adult", "growth", "aafco", "thức ăn", "khẩu phần", "bữa",
    ),
    "symptom": (
        "symptom", "vomit", "vomiting", "diarrhea", "dehydration", "lethargy",
        "emergency", "nôn", "tiêu chảy", "mất nước", "lờ đờ",
    ),
    "vaccine": (
        "vaccine", "vaccination", "rabies", "distemper", "parvovirus", "parvo",
        "booster", "puppy care", "tiêm", "vắc xin", "dại",
    ),
}

_INTENT_NEGATIVE_CHUNK_TERMS: dict[str, tuple[str, ...]] = {
    "nutrition": (
        "selecting a dog", "description of dogs", "dental development",
        "providing a home for a dog", "home for a dog", "outdoor dogs",
        "potential sources for obtaining", "choosing a dog",
    ),
}


def _estimate_tokens(text: str) -> int:
    if not text:
        return 0
    try:
        import tiktoken
        enc = tiktoken.get_encoding("cl100k_base")
        return len(enc.encode(text))
    except Exception:
        pass
    return len(text) // 2


def _trim_text_to_tokens(text: str, max_tokens: int) -> str:
    estimated = _estimate_tokens(text)
    if estimated <= max_tokens:
        return text
    chars_to_keep = max_tokens * 2
    return text[:chars_to_keep] + "\n[...trimmed...]"


def _unwrap_context_payload(payload: Optional[dict]) -> dict:
    if not isinstance(payload, dict):
        return {}

    data = payload.get("data")
    if isinstance(data, dict):
        return _unwrap_context_payload(data)

    return payload


def _context_value(data: dict, key: str):
    if not isinstance(data, dict):
        return None

    value = data.get(key)
    if value is not None and value != "":
        return value

    pascal_key = key[:1].upper() + key[1:]
    value = data.get(pascal_key)
    if value is not None and value != "":
        return value

    return None


def _context_list(data: dict, key: str) -> list:
    value = _context_value(data, key)
    return value if isinstance(value, list) else []


def _context_float(data: dict, key: str) -> Optional[float]:
    value = _context_value(data, key)
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _context_int(data: dict, key: str) -> Optional[int]:
    value = _context_value(data, key)
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _context_bool(data: dict, key: str) -> Optional[bool]:
    value = _context_value(data, key)
    if value is None or value == "":
        return None
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        lower = value.strip().lower()
        if lower in {"true", "1", "yes", "y"}:
            return True
        if lower in {"false", "0", "no", "n"}:
            return False
    return bool(value)


def _format_context_date(value) -> str:
    if value is None or value == "":
        return ""
    return str(value).split("T", 1)[0]


def _trim_context_line(value, limit: int = 220) -> str:
    text = str(value or "").strip()
    if len(text) <= limit:
        return text
    return text[: limit - 3].rstrip() + "..."


def _format_medical_record_line(record: dict) -> str:
    title = _context_value(record, "title") or "Ho so y te"
    record_type = _context_value(record, "recordType")
    record_date = _format_context_date(
        _context_value(record, "recordDate") or _context_value(record, "createdAt")
    )
    description = _trim_context_line(_context_value(record, "description"))
    medication = _context_value(record, "medicationName")
    dosage = _context_value(record, "dosage")
    clinic = _context_value(record, "clinicName")

    prefix_parts = []
    if record_date:
        prefix_parts.append(record_date)
    if record_type:
        prefix_parts.append(str(record_type))

    line = f"- {title}"
    if prefix_parts:
        line += f" ({', '.join(prefix_parts)})"
    details = [part for part in (description, medication, dosage, clinic) if part]
    if details:
        line += ": " + "; ".join(str(part) for part in details)
    return line


def _infer_species_label(pet_profile: Optional[dict]) -> Optional[str]:
    data = _unwrap_context_payload(pet_profile)
    species = str(_context_value(data, "species") or "").lower()
    if "dog" in species or "chó" in species or "cho" == species:
        return "dog"
    if "cat" in species or "mèo" in species or "meo" == species:
        return "cat"
    return None


def _chunk_matches_species(chunk: dict, species: Optional[str]) -> bool:
    if species not in {"dog", "cat"}:
        return True

    content = str(chunk.get("content") or "").lower()
    source_url = str(chunk.get("source_url") or "").lower()
    source_title = str(chunk.get("source_title") or "").lower()
    haystack = f"{content}\n{source_url}\n{source_title}"

    if species == "dog":
        return "[cat]" not in haystack and "/cat-owners/" not in haystack

    return "[dog]" not in haystack and "/dog-owners/" not in haystack


# ──────────────────────────────────────────────
# Prompt Template Engine
# ──────────────────────────────────────────────

def _filter_chunks_by_pet_species(
    rag_chunks: list[dict],
    pet_profile: Optional[dict],
) -> list[dict]:
    pet_species = _infer_species_label(pet_profile)
    if not rag_chunks or pet_species not in {"dog", "cat"}:
        return rag_chunks

    filtered_chunks = [
        chunk for chunk in rag_chunks if _chunk_matches_species(chunk, pet_species)
    ]
    removed_count = len(rag_chunks) - len(filtered_chunks)
    if removed_count:
        logger.warning(
            "Filtered %d RAG chunks by pet species guard. Species=%s kept=%d original=%d",
            removed_count,
            pet_species,
            len(filtered_chunks),
            len(rag_chunks),
        )

    return filtered_chunks


def _build_pet_context_from_payloads(
    pet_id: Optional[str],
    pet_type: Optional[str],
    pet_profile: Optional[dict],
    pet_medical: Optional[dict],
) -> PetContext:
    profile_data = _unwrap_context_payload(pet_profile)
    medical_data = _unwrap_context_payload(pet_medical)
    health_profile = _context_value(medical_data, "healthProfile") or {}

    return PetContext(
        pet_id=pet_id,
        pet_name=_context_value(profile_data, "name"),
        species=_context_value(profile_data, "species") or pet_type,
        breed=_context_value(profile_data, "breed"),
        age=_context_value(profile_data, "ageFormatted"),
        age_months=_context_int(profile_data, "ageMonths"),
        weight_kg=_context_float(health_profile, "currentWeightKg"),
        gender=_context_value(profile_data, "gender"),
        is_neutered=_context_bool(health_profile, "isNeutered"),
    )


def _normalize_ascii(text: str) -> str:
    normalized = unicodedata.normalize("NFD", text.lower())
    return "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")


def _sanitize_context_for_rewrite(pet_context: PetContext) -> PetContext:
    return PetContext(
        pet_id=pet_context.pet_id,
        pet_name=pet_context.pet_name,
        species=pet_context.species,
        age=pet_context.age,
        age_months=pet_context.age_months,
        weight_kg=pet_context.weight_kg,
        gender=pet_context.gender,
        is_neutered=pet_context.is_neutered,
    )


def _rewrite_context_for_message(content: str, pet_context: PetContext) -> PetContext:
    normalized = _normalize_ascii(content)
    has_explicit_age = bool(
        re.search(r"\b\d+\s*(thang|month|months|tuoi|year|years)\b", normalized)
    )

    if "cho con" in normalized or "puppy" in normalized:
        return PetContext(species="dog", age="puppy")
    if "meo con" in normalized or "kitten" in normalized:
        return PetContext(species="cat", age="kitten")
    if has_explicit_age:
        return PetContext(species=pet_context.species)

    return _sanitize_context_for_rewrite(pet_context)


def _rewrite_rag_query(
    content: str,
    intent_enum: Intent,
    pet_context: PetContext,
) -> tuple[str, str]:
    if not DataSourceMap.is_llm_rewrite_candidate(intent_enum):
        return content, "not_needed"

    rewrite_context = _rewrite_context_for_message(content, pet_context)
    try:
        rewrite_result = query_rewriter.rewrite(
            message=content,
            intent=intent_enum,
            pet_context=rewrite_context,
        )
        for warning in rewrite_result.warnings:
            logger.warning("Query rewrite warning: %s", warning)
        return rewrite_result.rewritten or content, rewrite_result.rewrite_method
    except Exception as e:
        logger.warning("Query rewrite failed, using original query: %s", e)
        return content, "failed"


def _chunk_haystack(chunk: dict) -> str:
    return " ".join(
        str(part or "").lower()
        for part in (
            chunk.get("source_title"),
            chunk.get("source_url"),
            chunk.get("content"),
        )
    )


def _is_negative_chunk_for_intent(chunk: dict, intent: str) -> bool:
    haystack = _chunk_haystack(chunk)
    return any(term in haystack for term in _INTENT_NEGATIVE_CHUNK_TERMS.get(intent, ()))


def _score_chunk_for_intent(chunk: dict, intent: str) -> float:
    similarity = float(chunk.get("similarity") or 0)
    haystack = _chunk_haystack(chunk)

    score = similarity
    for term in _INTENT_CHUNK_TERMS.get(intent, ()):
        if term in haystack:
            score += 1.0
    for term in _INTENT_NEGATIVE_CHUNK_TERMS.get(intent, ()):
        if term in haystack:
            score -= 3.0
    return score


def _select_rag_chunks_for_prompt(
    rag_chunks: list[dict],
    intent: str,
    pet_profile: Optional[dict],
    limit: int = RAG_PROMPT_CHUNKS,
) -> list[dict]:
    filtered_chunks = _filter_chunks_by_pet_species(rag_chunks, pet_profile)
    if not filtered_chunks:
        return []

    scored_chunks = [
        (_score_chunk_for_intent(chunk, intent), float(chunk.get("similarity") or 0), chunk)
        for chunk in filtered_chunks
    ]

    if intent in _INTENT_CHUNK_TERMS and any(score > 0.75 for score, _, _ in scored_chunks):
        scored_chunks = [
            item for item in scored_chunks if item[0] > 0.75
        ]
        non_generic_chunks = [
            item for item in scored_chunks
            if not _is_negative_chunk_for_intent(item[2], intent)
        ]
        if non_generic_chunks:
            scored_chunks = non_generic_chunks
    elif intent == "nutrition":
        logger.warning("Nutrition RAG chunks did not pass relevance guard; dropping chunks.")
        return []

    scored_chunks.sort(key=lambda item: (item[0], item[1]), reverse=True)

    selected: list[dict] = []
    seen: set[str] = set()
    for _, _, chunk in scored_chunks:
        content = str(chunk.get("content") or "")
        dedupe_key = f"{chunk.get('source_url') or ''}:{content[:220]}"
        if dedupe_key in seen:
            continue
        seen.add(dedupe_key)
        selected.append(chunk)
        if len(selected) >= limit:
            break

    return selected


def _build_prompt(
    intent: str,
    intent_instruction: str,
    user_message: str,
    pet_profile: Optional[dict],
    pet_medical: Optional[dict],
    recent_messages: Optional[list],
    rag_chunks: list[dict],
) -> tuple[str, list[dict]]:
    """
    Builds structured prompt from slots.
    Returns (system_prompt, sources).
    sources is a list of {url, title, snippet} for the frontend.
    """
    system_parts = []

    # Slot: identity
    system_parts.append(
        "Bạn là trợ lý chăm sóc thú cưng chuyên nghiệp của nền tảng PetOmi.\n"
        "Nguyên tắc quan trọng:\n"
        "- Trả lời bằng TIẾNG VIỆT cho câu hỏi tiếng Việt, TIẾNG ANH cho câu hỏi tiếng Anh\n"
        "- Đưa ra lời khuyên nhanh, thiết thực dựa trên kiến thức thú y phổ thông\n"
        "- Nếu người dùng mô tả triệu chứng nguy hiểm, KHUYẾN NGHỊ HỌ ĐẾN BÁC SĨ THÚ Y NGAY\n"
        "- KHÔNG chẩn đoán bệnh cụ thể, chỉ đưa ra thông tin tham khảo chung\n"
        "- Nếu bạn không chắc chắn, hãy nói rõ rằng đây chỉ là thông tin tham khảo"
    )

    # Slot: intent instruction
    system_parts.append(f"\n[INTENT]\n{intent_instruction}")

    # Slot: pet profile
    if pet_profile:
        data = _unwrap_context_payload(pet_profile)
        parts = []
        if data.get("name"):
            parts.append(f"- Tên: {data['name']}")
        if data.get("species"):
            parts.append(f"- Loài: {data['species']}")
            pet_species = _infer_species_label(pet_profile)
            if pet_species == "dog":
                parts.append("- Species guard: This pet is a dog. Refer to this pet as chó/bé, not mèo/cat.")
            elif pet_species == "cat":
                parts.append("- Species guard: This pet is a cat. Refer to this pet as mèo/bé, not chó/dog.")
        if data.get("breed"):
            parts.append(f"- Giống: {data['breed']}")
        if data.get("ageFormatted"):
            parts.append(f"- Tuổi: {data['ageFormatted']}")
        elif data.get("ageMonths") is not None:
            parts.append(f"- Tuổi: {data['ageMonths']} tháng")
        if data.get("gender"):
            parts.append(f"- Giới tính: {data['gender']}")
        if parts:
            system_parts.append(f"\n[PET_PROFILE]\n" + "\n".join(parts))

    # Slot: medical summary
    if pet_medical:
        medical_data = _unwrap_context_payload(pet_medical)
        hp = _context_value(medical_data, "healthProfile") or {}
        medical_parts = []
        if _context_value(hp, "currentWeightKg"):
            medical_parts.append(f"- Cân nặng hiện tại: {_context_value(hp, 'currentWeightKg')} kg")
        if _context_value(hp, "isNeutered"):
            medical_parts.append(f"- Tình trạng triệt sản: {_context_value(hp, 'isNeutered')}")
        if _context_value(hp, "allergies"):
            medical_parts.append(f"- Dị ứng: {_context_value(hp, 'allergies')}")
        if _context_value(hp, "chronicConditions"):
            medical_parts.append(f"- Bệnh mạn tính: {_context_value(hp, 'chronicConditions')}")

        recent_weights = _context_list(medical_data, "recentWeightLogs")[:5]
        if recent_weights:
            medical_parts.append("- Cân nặng gần đây:")
            for weight in recent_weights:
                measured_at = _format_context_date(_context_value(weight, "measuredAt"))
                note = _context_value(weight, "note")
                line = f"  + {_context_value(weight, 'weightKg')} kg"
                if measured_at:
                    line += f" ({measured_at})"
                if note:
                    line += f": {_trim_context_line(note, 120)}"
                medical_parts.append(line)

        vaccinations = _context_list(medical_data, "vaccinations")[:8]
        if vaccinations:
            medical_parts.append("- Vaccine/tiêm phòng đã lưu:")
            medical_parts.extend(f"  + {_format_medical_record_line(v)[2:]}" for v in vaccinations)

        medical_records = _context_list(medical_data, "medicalRecords")[:8]
        if medical_records:
            medical_parts.append("- Tiền sử/hồ sơ y tế đã lưu:")
            medical_parts.extend(f"  + {_format_medical_record_line(r)[2:]}" for r in medical_records)
        if medical_parts:
            system_parts.append(f"\n[MEDICAL_SUMMARY]\n" + "\n".join(medical_parts))

    # Slot: conversation history
    if recent_messages and len(recent_messages) > 0:
        lines = []
        for msg in recent_messages[-6:]:
            role = msg.get("senderRole") or msg.get("sender_role") or "unknown"
            content = (msg.get("content") or "").strip()
            if not content:
                continue
            lines.append(f"- {role}: {content[:400]}")
        if lines:
            system_parts.append(f"\n[HISTORY]\n" + "\n".join(lines))

    # Slot: knowledge chunks
    sources: list[dict] = []
    seen_sources: set[str] = set()
    if rag_chunks:
        pet_species = _infer_species_label(pet_profile)
        species_filtered_chunks = [
            chunk for chunk in rag_chunks if _chunk_matches_species(chunk, pet_species)
        ]
        if rag_chunks and not species_filtered_chunks:
            logger.warning(
                "All RAG chunks were filtered out by pet species guard. Species=%s chunks=%d",
                pet_species,
                len(rag_chunks),
            )

        chunk_texts = []
        chunk_tokens = 0
        for chunk in species_filtered_chunks:
            content = chunk.get("content", "")
            source_title = chunk.get("source_title", "Nguồn không xác định")
            source_url = chunk.get("source_url", "")
            chunk_text = f"[{source_title}]\n{content}"
            estimated_tokens = _estimate_tokens(chunk_text)
            if chunk_texts and chunk_tokens + estimated_tokens > BUDGET_CHUNKS:
                logger.warning(
                    "Knowledge context exceeded chunk budget. Kept %d chunks under %d tokens.",
                    len(chunk_texts),
                    BUDGET_CHUNKS,
                )
                break
            if estimated_tokens > BUDGET_CHUNKS:
                chunk_text = _trim_text_to_tokens(chunk_text, BUDGET_CHUNKS)
                estimated_tokens = _estimate_tokens(chunk_text)
            chunk_tokens += estimated_tokens
            chunk_texts.append(chunk_text)
            source_key = f"{source_title}:{source_url}"
            if source_key not in seen_sources:
                sources.append({
                    "url": source_url,
                    "title": source_title,
                    "snippet": content[:300],
                })
                seen_sources.add(source_key)
        system_parts.append(
            f"\n[KNOWLEDGE]\n"
            + "\n\n".join(chunk_texts)
            + "\n\nHãy dựa trên thông tin trên để đưa ra câu trả lời chính xác và hữu ích nhất. "
            + "Nếu thông tin không đủ, nói rõ và gợi ý tham khảo bác sĩ thú y."
        )

    system_prompt = "\n".join(system_parts)

    # Enforce token budget on system prompt
    system_tokens = _estimate_tokens(system_prompt)
    budget = 128000 - LLM_PRIMARY_MAX_TOKENS - BUDGET_RESERVED
    if system_tokens > budget:
        logger.warning(
            "System prompt too large (%d tokens). Trimming from %d to %d tokens.",
            system_tokens, system_tokens, budget,
        )
        system_prompt = _trim_text_to_tokens(system_prompt, budget)

    return system_prompt, sources


def _is_pet_profile_question(message: str) -> bool:
    lower = message.lower()
    pet_terms = ("chó", "cho", "mèo", "meo", "pet", "thú cưng", "thu cung", "bé", "be")
    profile_terms = (
        "tên gì",
        "ten gi",
        "tên là gì",
        "ten la gi",
        "tên của",
        "ten cua",
        "name",
        "bao nhiêu tuổi",
        "bao nhieu tuoi",
        "tuổi",
        "tuoi",
        "giống gì",
        "giong gi",
        "loài gì",
        "loai gi",
    )
    return any(term in lower for term in pet_terms) and any(term in lower for term in profile_terms)


def _build_pet_profile_answer(message: str, pet_profile: Optional[dict]) -> Optional[str]:
    if not _is_pet_profile_question(message):
        return None

    if not pet_profile:
        return (
            "Mình chưa có hồ sơ thú cưng được gắn với cuộc trò chuyện này. "
            "Bạn hãy chọn bé ở khung bên phải rồi hỏi lại nhé."
        )

    data = _unwrap_context_payload(pet_profile)
    name = data.get("name")
    if not name:
        return (
            "Mình đã lấy được hồ sơ thú cưng nhưng chưa thấy tên của bé trong dữ liệu. "
            "Bạn kiểm tra lại hồ sơ thú cưng giúp mình nhé."
        )

    parts = [f"Bé của bạn tên là {name}."]
    if data.get("species"):
        parts.append(f"Loài: {data['species']}.")
    if data.get("breed"):
        parts.append(f"Giống: {data['breed']}.")
    if data.get("ageFormatted"):
        parts.append(f"Tuổi: {data['ageFormatted']}.")
    elif data.get("ageMonths") is not None:
        parts.append(f"Tuổi: {data['ageMonths']} tháng.")

    return " ".join(parts)


def _is_pet_medical_history_question(message: str) -> bool:
    lower = message.lower()
    history_terms = (
        "tiền sử",
        "tien su",
        "bệnh sử",
        "benh su",
        "hồ sơ bệnh",
        "ho so benh",
        "hồ sơ y tế",
        "ho so y te",
        "lịch sử bệnh",
        "lich su benh",
        "medical history",
        "health record",
        "đã bị bệnh",
        "da bi benh",
    )
    return any(term in lower for term in history_terms)


def _build_pet_medical_answer(
    message: str,
    pet_profile: Optional[dict],
    pet_medical: Optional[dict],
) -> Optional[str]:
    if not _is_pet_medical_history_question(message):
        return None

    profile_data = _unwrap_context_payload(pet_profile)
    medical_data = _unwrap_context_payload(pet_medical)
    pet_name = _context_value(profile_data, "name") or "bé"

    if not pet_medical:
        return (
            f"Mình chưa lấy được hồ sơ y tế của {pet_name} trong cuộc trò chuyện này. "
            "Bạn kiểm tra lại bé đã được chọn ở khung bên phải, hoặc thử tải lại cuộc trò chuyện nhé."
        )

    hp = _context_value(medical_data, "healthProfile") or {}
    vaccinations = _context_list(medical_data, "vaccinations")
    medical_records = _context_list(medical_data, "medicalRecords")
    recent_weights = _context_list(medical_data, "recentWeightLogs")

    lines = [f"Mình thấy hồ sơ sức khỏe của {pet_name} như sau:"]

    profile_lines = []
    if _context_value(hp, "currentWeightKg"):
        profile_lines.append(f"cân nặng hiện tại {_context_value(hp, 'currentWeightKg')} kg")
    if _context_value(hp, "isNeutered"):
        profile_lines.append(f"triệt sản: {_context_value(hp, 'isNeutered')}")
    if _context_value(hp, "allergies"):
        profile_lines.append(f"dị ứng: {_context_value(hp, 'allergies')}")
    if _context_value(hp, "chronicConditions"):
        profile_lines.append(f"bệnh mạn tính: {_context_value(hp, 'chronicConditions')}")
    if profile_lines:
        lines.append("- Thông tin sức khỏe: " + "; ".join(profile_lines) + ".")

    if medical_records:
        lines.append("- Tiền sử/hồ sơ y tế đã lưu:")
        lines.extend(_format_medical_record_line(record) for record in medical_records[:6])

    if vaccinations:
        lines.append("- Vaccine/tiêm phòng đã lưu:")
        lines.extend(_format_medical_record_line(vaccine) for vaccine in vaccinations[:6])

    if recent_weights:
        weight_lines = []
        for weight in recent_weights[:5]:
            measured_at = _format_context_date(_context_value(weight, "measuredAt"))
            label = f"{_context_value(weight, 'weightKg')} kg"
            if measured_at:
                label += f" ({measured_at})"
            weight_lines.append(label)
        if weight_lines:
            lines.append("- Cân nặng gần đây: " + "; ".join(weight_lines) + ".")

    if len(lines) == 1:
        return (
            f"Mình chưa thấy hồ sơ bệnh án, vaccine, dị ứng, bệnh mạn tính hoặc log cân nặng nào đã lưu cho {pet_name}. "
            "Nếu bạn có thông tin khám trước đây, hãy cập nhật vào hồ sơ y tế để PetOmi tư vấn sát hơn."
        )

    lines.append(
        "Các thông tin này chỉ là dữ liệu đã lưu trên PetOmi; nếu bạn đang thấy triệu chứng bất thường, nên hỏi bác sĩ thú y để được đánh giá trực tiếp."
    )
    return "\n".join(lines)


def _get_intent_instruction(intent: str) -> str:
    instructions = {
        "appointment": (
            "Chủ đề này liên quan đến ĐẶT LỊCH KHÁM THÚ Y. "
            "Hãy hướng dẫn người dùng cách đặt lịch, thông tin cần chuẩn bị, "
            "và những câu hỏi nên hỏi khi đặt lịch khám."
        ),
        "nutrition": (
            "Chủ đề này liên quan đến DINH DƯỠNG cho thú cưng. "
            "Cung cấp thông tin về thức ăn phù hợp, lượng thức ăn, "
            "vitamin và thực phẩm bổ sung phù hợp với loài, giống, và độ tuổi. "
            "Luôn nhắc đến khẩu phần theo cân nặng/thể trạng/mức vận động, số bữa trong ngày, "
            "protein/chất béo/nước uống, và tránh tự bổ sung vitamin nếu chưa có chỉ định thú y."
        ),
        "symptom": (
            "Chủ đề này liên quan đến TRIỆU CHỨNG SỨC KHỎE. "
            "Đưa ra các triệu chứng có thể gặp, mức độ nghiêm trọng, "
            "và khuyến nghị có nên đi khám hay theo dõi tại nhà. "
            "LUÔN nhắc người dùng tham khảo ý kiến bác sĩ thú y."
        ),
        "vaccine": (
            "Chủ đề này liên quan đến TIÊM PHÒNG VẮC XIN. "
            "Cung cấp thông tin về lịch tiêm phòng, loại vaccine cần thiết, "
            "và lưu ý sau tiêm cho thú cưng."
        ),
        "emergency": (
            "ĐÂY LÀ TÌNH HUỐNG KHẨN CẤP! "
            "Hãy phản hồi ngay lập tức với hướng dẫn sơ cấp cứu. "
            "LUÔN khuyến nghị người dùng đến phòng khám thú y gần nhất NGAY BÂY GIỜ. "
            "Cung cấp các bước xử lý tạm thời trong khi chờ đến phòng khám."
        ),
        "billing": (
            "Chủ đề này liên quan đến CHI PHÍ VÀ THANH TOÁN. "
            "Cung cấp thông tin giá cả tham khảo, cách thanh toán, "
            "và chương trình bảo hiểm thú y nếu có."
        ),
        "grooming": (
            "Chủ đề này liên quan đến CHĂM SÓC LÔNG VÀ VỆ SINH. "
            "Hướng dẫn cách tắm, chải lông, cắt móng, vệ sinh tai, "
            "và các sản phẩm chăm sóc phù hợp."
        ),
        "training": (
            "Chủ đề này liên quan đến HUẤN LUYỆN thú cưng. "
            "Cung cấp kỹ thuật huấn luyện, cách dạy các lệnh cơ bản, "
            "và cách xử lý các vấn đề hành vi."
        ),
        "behavior": (
            "Chủ đề này liên quan đến HÀNH VI VÀ CẢM XÚC. "
            "Giải thích nguyên nhân có thể của hành vi, "
            "cách cải thiện, và khi nào cần hỗ trợ chuyên gia."
        ),
        "product": (
            "Chủ đề này liên quan đến SẢN PHẨM VÀ VẬT DỤNG. "
            "Gợi ý các sản phẩm phù hợp, đưa ra đánh giá khách quan, "
            "và lưu ý khi mua đồ cho thú cưng."
        ),
        "general": (
            "Đây là câu hỏi chung hoặc lời chào. "
            "Trả lời thân thiện, hữu ích, và hướng người dùng đến các tính năng "
            "của nền tảng PetOmi nếu phù hợp."
        ),
    }
    return instructions.get(intent, instructions["general"])


# ──────────────────────────────────────────────
# Intent Classification
# ──────────────────────────────────────────────

async def classify_intent(
    content: str,
    pet_id: Optional[str] = None,
    pet_type: Optional[str] = None,
) -> dict:
    if not content or not content.strip():
        raise ValueError("Message content cannot be null or empty.")

    context = RoutingContext(
        message=content,
        pet_id=pet_id,
        pet_type=pet_type,
    )
    result = hybrid_router.route(context)
    return {
        "intent": result.intent.value,
        "confidence": result.confidence,
        "urgency_level": result.urgency_level.value,
        "routing_source": result.routing_source.value,
        "reasoning": result.reasoning,
    }


# ──────────────────────────────────────────────
# Core: call GPT-4o with retry
# ──────────────────────────────────────────────

async def _call_llm(
    messages: list[dict],
    model: str,
    max_tokens: int,
) -> tuple[str, dict]:
    response = openai_client.chat.completions.create(
        model=model,
        messages=messages,
        max_tokens=max_tokens,
        temperature=0.7,
    )
    content = response.choices[0].message.content or ""
    usage = response.usage or {}
    return content, usage


async def call_openai_chat(
    content: str,
    user_id: str,
    conversation_id: str,
    pet_id: Optional[str] = None,
    pet_type: Optional[str] = None,
    enable_rag: bool = True,
) -> dict:
    start_time = time.time()

    routing_info = await classify_intent(content, pet_id, pet_type)
    intent = routing_info["intent"]
    urgency = routing_info["urgency_level"]
    routing_source = routing_info["routing_source"]

    intent_instruction = _get_intent_instruction(intent)
    try:
        intent_enum = Intent(intent)
    except ValueError:
        intent_enum = Intent.GENERAL

    # Parallel fetch all context sources
    rag_chunks: list[dict] = []
    pet_profile: Optional[dict] = None
    pet_medical: Optional[dict] = None
    recent_messages: Optional[list] = None
    rag_query_used: Optional[str] = None
    rag_rewrite_method: Optional[str] = None
    rag_error: Optional[str] = None

    try:
        fetch_result = await parallel_fetch_all(
            user_id=user_id,
            conversation_id=conversation_id,
            pet_id=pet_id,
            original_query=content,
            rewritten_query=None,
            intent=intent,
            rag_topics=None,
            enable_rag=enable_rag,
            defer_rag=True,
        )

        for warning in fetch_result.get("warnings", []):
            logger.warning("ParallelFetch warning: %s", warning)

        if fetch_result.get("pet_basic_context"):
            pet_profile = fetch_result["pet_basic_context"]

        if fetch_result.get("pet_medical_summary"):
            pet_medical = fetch_result["pet_medical_summary"]

        if fetch_result.get("conversation_recent_messages"):
            rm = fetch_result["conversation_recent_messages"]
            if rm.get("success") and rm.get("data"):
                recent_messages = rm["data"].get("messages") or []

    except Exception as e:
        logger.warning(
            "Partial context: parallel fetch failed (%s). Proceeding with available data.",
            e,
        )

    direct_profile_answer = _build_pet_profile_answer(content, pet_profile)
    if direct_profile_answer:
        elapsed_ms = int((time.time() - start_time) * 1000)
        return {
            "response": direct_profile_answer,
            "intent": intent,
            "urgency_level": urgency,
            "rag_used": False,
            "chunks_used": 0,
            "sources": [],
            "vet_recommendation": None,
            "model": "pet-profile-context",
            "tokens_input": 0,
            "tokens_output": 0,
            "latency_ms": elapsed_ms,
            "routing_source": routing_source,
            "rag_query_used": None,
            "rag_rewrite_method": None,
            "rag_error": None,
        }

    direct_medical_answer = _build_pet_medical_answer(content, pet_profile, pet_medical)
    if direct_medical_answer:
        elapsed_ms = int((time.time() - start_time) * 1000)
        return {
            "response": direct_medical_answer,
            "intent": intent,
            "urgency_level": "normal",
            "rag_used": False,
            "chunks_used": 0,
            "sources": [],
            "vet_recommendation": None,
            "model": "pet-medical-context",
            "tokens_input": 0,
            "tokens_output": 0,
            "latency_ms": elapsed_ms,
            "routing_source": routing_source,
            "rag_query_used": None,
            "rag_rewrite_method": None,
            "rag_error": None,
        }

    if enable_rag and DataSourceMap.needs_rag(intent_enum):
        pet_context = _build_pet_context_from_payloads(
            pet_id=pet_id,
            pet_type=pet_type,
            pet_profile=pet_profile,
            pet_medical=pet_medical,
        )
        rag_query_used, rag_rewrite_method = _rewrite_rag_query(
            content=content,
            intent_enum=intent_enum,
            pet_context=pet_context,
        )
        rag_topics = DataSourceMap.rag_filter_topics(intent_enum)
        metadata_filter = {"topic": rag_topics} if rag_topics else None
        _, raw_rag_chunks, rag_error = await search_rag_with_timeout(
            query=rag_query_used,
            metadata_filter=metadata_filter,
            top_k=RAG_CANDIDATE_CHUNKS,
        )
        if rag_error:
            logger.warning(
                "PgVector/RAG search failed (%s). Proceeding without knowledge chunks.",
                rag_error,
            )
        else:
            rag_chunks = _select_rag_chunks_for_prompt(
                raw_rag_chunks,
                intent,
                pet_profile,
            )

    # Build structured prompt
    system_prompt, sources = _build_prompt(
        intent=intent,
        intent_instruction=intent_instruction,
        user_message=content,
        pet_profile=pet_profile,
        pet_medical=pet_medical,
        recent_messages=recent_messages,
        rag_chunks=rag_chunks,
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": content},
    ]

    # GPT-4o primary call
    model_used = LLM_PRIMARY_MODEL
    max_tokens_used = LLM_PRIMARY_MAX_TOKENS

    try:
        answer, usage = await _call_llm(messages, model_used, max_tokens_used)
    except Exception as primary_error:
        logger.warning(
            "Primary LLM (%s) failed: %s. Retrying once with the same model.",
            model_used, primary_error,
        )
        try:
            answer, usage = await _call_llm(messages, model_used, max_tokens_used)
        except Exception as fallback_error:
            logger.error("Retry LLM call also failed: %s", fallback_error)
            raise RuntimeError(
                f"AI service failed after retry. First: {primary_error}, "
                f"Retry: {fallback_error}"
            ) from fallback_error

    elapsed_ms = int((time.time() - start_time) * 1000)

    vet_recommendation = None
    if urgency == "critical":
        vet_recommendation = "urgent"
    elif urgency == "high":
        vet_recommendation = "watch"
    elif intent in ("symptom", "emergency"):
        vet_recommendation = "monitor"

    logger.info(
        "OpenAI call completed. Intent=%s urgency=%s model=%s tokens_in=%d tokens_out=%d latency_ms=%d chunks=%d sources=%d",
        intent,
        urgency,
        model_used,
        usage.prompt_tokens if usage else 0,
        usage.completion_tokens if usage else 0,
        elapsed_ms,
        len(rag_chunks),
        len(sources),
    )

    return {
        "response": answer,
        "intent": intent,
        "urgency_level": urgency,
        "rag_used": len(rag_chunks) > 0,
        "chunks_used": len(rag_chunks),
        "sources": sources,
        "vet_recommendation": vet_recommendation,
        "model": model_used,
        "tokens_input": usage.prompt_tokens if usage else 0,
        "tokens_output": usage.completion_tokens if usage else 0,
        "latency_ms": elapsed_ms,
        "routing_source": routing_source,
        "rag_query_used": rag_query_used,
        "rag_rewrite_method": rag_rewrite_method,
        "rag_error": rag_error,
    }


# ──────────────────────────────────────────────
# Main entry point
# ──────────────────────────────────────────────

async def process_message(request: ChatProcessRequest) -> AiWebhookPayload:
    if not request.content or not request.content.strip():
        raise ValueError("Message content cannot be null or empty.")

    try:
        result = await call_openai_chat(
            content=request.content,
            user_id=request.user_id,
            conversation_id=request.conversation_id,
            pet_id=request.pet_id,
            pet_type=None,
        )

        payload = AiWebhookPayload(
            message_id=request.message_id,
            user_id=request.user_id,
            conversation_id=request.conversation_id,
            response=result["response"],
            intent=result.get("intent"),
            urgency_level=result.get("urgency_level"),
            rag_used=result.get("rag_used", False),
            chunks_used=result.get("chunks_used"),
            sources=result.get("sources", []),
            vet_recommendation=result.get("vet_recommendation"),
            model=result.get("model"),
            tokens_input=result.get("tokens_input", 0),
            tokens_output=result.get("tokens_output", 0),
        )

        headers = {}
        if settings.dotnet_api_webhook_secret:
            headers["X-Webhook-Secret"] = settings.dotnet_api_webhook_secret

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                request.webhook_url,
                json=payload.model_dump(mode="json"),
                headers=headers,
            )
            response.raise_for_status()
            logger.info(
                "Webhook delivered successfully for message %s. Status: %s",
                request.message_id,
                response.status_code,
            )

        return payload

    except httpx.HTTPStatusError as e:
        logger.error(
            "Webhook failed for message %s. Status: %s. Body: %s",
            request.message_id,
            e.response.status_code,
            e.response.text,
        )
        raise
    except Exception as e:
        logger.error("Failed to process message %s: %s", request.message_id, e)
        raise
