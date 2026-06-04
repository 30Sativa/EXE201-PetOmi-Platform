import json
import logging
from dataclasses import dataclass, field
from typing import Optional

from openai import BadRequestError

from app.config import settings
from app.context.data_sources import DataSourceMap
from app.routing.intents import Intent

logger = logging.getLogger(__name__)

LLM_MODEL = "gpt-4o-mini"
LLM_MAX_TOKENS = 256
LLM_TEMPERATURE = 0.3

REWRITE_TRIGGER_PATTERNS = [
    "?", "bao nhiêu", "như thế nào", "tại sao",
    "what", "how", "why", "which", "should", "can", "could",
    "cách nào", "làm sao", "nên làm gì",
]

REWRITE_MIN_LENGTH = 15

REWRITE_TRIGGER_PATTERNS.extend([
    "bao nhiêu", "như thế nào", "tại sao", "cách nào", "làm sao", "nên làm gì",
    "vomiting", "diarrhea", "fever", "blood", "cough", "sick",
    "nôn", "tiêu chảy", "sốt", "ho", "bệnh",
])


@dataclass
class RewriteResult:
    original: str
    rewritten: str
    was_rewritten: bool
    intent: Intent
    confidence: float
    llm_raw_response: Optional[dict] = None
    rewrite_method: str = "original"
    warnings: list[str] = field(default_factory=list)


def _is_rewrite_candidate(message: str) -> bool:
    if len(message.strip()) <= REWRITE_MIN_LENGTH:
        return False
    msg_lower = message.lower()
    return any(p in msg_lower for p in REWRITE_TRIGGER_PATTERNS)


_TEMPLATES: dict[Intent, list[str]] = {
    Intent.NUTRITION: [
        "What is the recommended {food_type} for a {species} (age: {age}, weight: {weight})?",
        "How much {food_type} should I feed my {species} (age: {age}, weight: {weight})?",
        "What nutrients does a {species} (age: {age}) need?",
        "Is {food_item} safe for {species} (age: {age})?",
    ],
    Intent.SYMPTOM: [
        "My {species} (age: {age}, weight: {weight}) has {symptom}. What could it be?",
        "Is {symptom} in a {species} (age: {age}) serious?",
        "What are the causes of {symptom} in {species}?",
        "How to treat {symptom} in {species} (age: {age})?",
    ],
    Intent.VACCINE: [
        "What vaccines does a {species} (age: {age}) need and when?",
        "Is the {vaccine_name} vaccine safe for {species} (age: {age})?",
        "What are the side effects of {vaccine_name} for {species}?",
        "When should {species} (age: {age}) get {vaccine_name}?",
    ],
    Intent.BEHAVIOR: [
        "Why does my {species} (age: {age}) show {behavior}?",
        "Is {behavior} normal for a {species} (age: {age})?",
        "How to address {behavior} in {species} (age: {age})?",
        "What does {behavior} mean in {species} body language?",
    ],
    Intent.TRAINING: [
        "How to train a {species} (age: {age}) to {command}?",
        "What is the best way to teach {command} to {species} (age: {age})?",
        "How to stop {species} from {bad_behavior}?",
        "What training techniques work for {species} (age: {age})?",
    ],
}


def _apply_template(message: str, intent: Intent, pet_context: "PetContext") -> str:
    if intent not in _TEMPLATES:
        return message

    if intent == Intent.NUTRITION and not (
        pet_context.age or pet_context.age_months or pet_context.weight_kg
    ):
        species = _extract_species(message, pet_context)
        food_item = _extract_food_item(message)
        if food_item != "food item":
            return f"Is {food_item} safe for {species}?"
        return f"What is the recommended food for a {species}?"

    templates = _TEMPLATES[intent]
    template = templates[0]

    placeholders = {
        "species": _extract_species(message, pet_context),
        "age": pet_context.age or f"{pet_context.age_months or 'unknown'} months",
        "weight": f"{pet_context.weight_kg} kg" if pet_context.weight_kg else "unknown weight",
        "food_type": _extract_food_type(message),
        "food_item": _extract_food_item(message),
        "symptom": _extract_symptom(message),
        "vaccine_name": _extract_vaccine_name(message),
        "behavior": _extract_behavior(message),
        "command": _extract_command(message),
        "bad_behavior": _extract_bad_behavior(message),
    }

    rewritten = template
    for key, val in placeholders.items():
        rewritten = rewritten.replace(f"{{{key}}}", val)

    if rewritten == template:
        return message

    return rewritten


def _extract_food_type(message: str) -> str:
    lower = message.lower()
    for kw in ["thức ăn", "food", "dry food", "wet food", "raw food"]:
        if kw in lower:
            return kw
    return "food"


def _extract_species(message: str, pet_context: "PetContext") -> str:
    lower = message.lower()
    import unicodedata
    ascii_lower = "".join(
        ch for ch in unicodedata.normalize("NFD", lower)
        if unicodedata.category(ch) != "Mn"
    )
    if any(kw in ascii_lower for kw in ("cho", "dog", "puppy")):
        return "dog"
    if any(kw in ascii_lower for kw in ("meo", "cat", "kitten")):
        return "cat"
    if any(kw in lower for kw in ("chó", "cho", "dog", "puppy")):
        return "dog"
    if any(kw in lower for kw in ("mèo", "meo", "cat", "kitten")):
        return "cat"
    if any(kw in lower for kw in ["mèo", "mÃ¨o", "cat", "kitten"]):
        return "cat"
    if any(kw in lower for kw in ["chó", "chÃ³", "dog", "puppy"]):
        return "dog"
    return pet_context.species or "pet"


def _extract_food_item(message: str) -> str:
    lower = message.lower()
    for kw in ["sô cô la", "chocolate", "nho", "grape", "tỏi", "garlic", "hành", "onion"]:
        if kw in lower:
            return kw
    import re
    match = re.search(r"(?:ăn|cho ăn|eat|feed)\s+(?:được\s+)?(.+?)(?:\s+\d|\?|$)", lower)
    if match:
        return match.group(1).strip()
    return "food item"


def _extract_symptom(message: str) -> str:
    import re
    patterns = [
        r"(?:bị|co|biểu hiện|symptom|triệu chứng)\s+(.{2,30}?)(?:\s+với|\s+ở|\s+không|$)",
        r"(?:is\s+having|has|showing)\s+(.{2,30}?)(?:\s+and|\s+with|$)",
        r"(?:sốt|ho|nôn|tiêu chảy|fever|cough|vomit|diarrhea)",
    ]
    for p in patterns:
        m = re.search(p, message.lower())
        if m:
            if m.lastindex:
                return m.group(1).strip().rstrip(",.?!")
            return m.group(0).strip().rstrip(",.?!")
    return "symptoms"


def _extract_vaccine_name(message: str) -> str:
    lower = message.lower()
    for kw in ["dại", "rabies", "5 bệnh", "7 bệnh", "parvo", "distemper"]:
        if kw in lower:
            return kw
    return "vaccine"


def _extract_behavior(message: str) -> str:
    lower = message.lower()
    for kw in ["sủa", "barking", "cắn", "biting", "liếm", "licking", "hay", "thường"]:
        if kw in lower:
            import re
            m = re.search(rf"{kw}\s+(.{{1,30}}?)(?:\s+khi|\s+vì|\?|$)", lower)
            if m:
                return m.group(1).strip()
            return kw
    import re
    m = re.search(r"tại sao\s+(?:con\s+)?(.+?)\s+(?:lại|bị|thường)", lower)
    if m:
        return m.group(1).strip()
    return "behavior"


def _extract_command(message: str) -> str:
    lower = message.lower()
    for kw in ["ngồi", "sit", "đứng", "stand", "lại", "come", "nằm", "down"]:
        if kw in lower:
            return kw
    return "basic commands"


def _extract_bad_behavior(message: str) -> str:
    lower = message.lower()
    for kw in ["cắn", "biting", "sủa", "barking", "nhảy", "jumping"]:
        if kw in lower:
            return kw
    return "unwanted behavior"


_LLM_SYSTEM_VI = """Bạn là chuyên gia viết lại câu hỏi (query rewriting) cho hệ thống RAG chăm sóc thú cưng PetOmi.

Nhiệm vụ: Chuyển câu hỏi tự nhiên của người dùng thành câu hỏi tìm kiếm tối ưu cho vector database.

QUY TẮC:
1. Gộp THÔNG TIN PET (species, age, weight) vào câu hỏi nếu có
2. THÊM context tiếng Anh vì vector model dùng English embeddings
3. GIỮ NGUYÊN ý nghĩa câu hỏi, chỉ bổ sung từ khóa tìm kiếm
4. Trả lời đúng format JSON:
{"rewritten_query": "...", "added_context": "...", "search_terms": ["...", "..."], "confidence": 0.0-1.0}

VÍ DỤ:
Input: "Con mèo tôi 3 tháng bị nôn"
Output: {"rewritten_query": "Vomiting in 3-month-old kitten causes and treatment", "added_context": "kitten 3 months old cat", "search_terms": ["vomiting kitten", "cat 3 months", "feline vomiting causes"], "confidence": 0.95}

Input: "Cho chó ăn gì tốt"
Output: {"rewritten_query": "Best dog food nutrition recommendations by age and weight", "added_context": "dog all ages", "search_terms": ["dog nutrition", "best dog food", "canine diet"], "confidence": 0.88}"""


_LLM_SYSTEM_EN = """You are an expert query rewriter for the PetOmi pet care RAG system.

Task: Transform natural user questions into optimal vector search queries.

RULES:
1. Include PET CONTEXT (species, age, weight) in the query if available
2. Use ENGLISH keywords because the embedding model uses English embeddings
3. Keep the ORIGINAL meaning, only add search-optimized terms
4. Return valid JSON:
{"rewritten_query": "...", "added_context": "...", "search_terms": ["...", "..."], "confidence": 0.0-1.0}

EXAMPLES:
Input: "My 6-month puppy has diarrhea"
Output: {"rewritten_query": "Diarrhea in 6-month-old puppy causes and treatment", "added_context": "puppy 6 months dog", "search_terms": ["diarrhea puppy", "puppy 6 months", "canine diarrhea treatment"], "confidence": 0.93}

Input: "Is chocolate bad for dogs"
Output: {"rewritten_query": "Chocolate toxicity in dogs dangers and symptoms", "added_context": "dog all ages", "search_terms": ["chocolate toxicity dogs", "canine poisoning", "dog food safety"], "confidence": 0.91}"""


def _detect_language(message: str) -> str:
    vi_chars = "àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ"
    vi_chars += "àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ"
    msg_lower = message.lower()
    vi_char_count = sum(1 for c in msg_lower if c in vi_chars)
    total_chars = len([c for c in msg_lower if c.isalpha()])
    if total_chars > 0 and (vi_char_count / total_chars) > 0.3:
        return "vi"
    ascii_vi_terms = {
        "con", "cho", "meo", "toi", "cua", "nay", "bi", "gi",
        "nen", "an", "lam", "sao", "benh",
    }
    words = set(msg_lower.replace("?", " ").replace(".", " ").split())
    if len(words & ascii_vi_terms) >= 2:
        return "vi"
    import unicodedata
    normalized = unicodedata.normalize("NFD", msg_lower)
    ascii_text = "".join(
        c for c in normalized
        if unicodedata.category(c) != "Mn"
    ).replace("đ", "d")
    ascii_words = set(ascii_text.replace("?", " ").replace(".", " ").split())
    if len(ascii_words & ascii_vi_terms) >= 2:
        return "vi"
    return "en"


class QueryRewriter:
    """Hybrid query rewriter: template-based for simple cases, LLM for complex."""

    def __init__(self) -> None:
        if not settings.openai_api_key:
            logger.warning("OPENAI_API_KEY not configured - LLM rewrite unavailable")
            self._client = None
        else:
            from openai import OpenAI
            self._client = OpenAI(api_key=settings.openai_api_key)

    def rewrite(
        self,
        message: str,
        intent: Intent,
        pet_context: "PetContext",
    ) -> RewriteResult:
        original = message.strip()
        warnings: list[str] = []

        should_rewrite = _is_rewrite_candidate(original)

        if not should_rewrite and DataSourceMap.is_llm_rewrite_candidate(intent):
            rewritten = _apply_template(original, intent, pet_context)
            method = "template_short_query" if rewritten != original else "not_needed"
            return RewriteResult(
                original=original,
                rewritten=rewritten,
                was_rewritten=(rewritten != original),
                intent=intent,
                confidence=0.75,
                rewrite_method=method,
                warnings=[] if rewritten != original else ["Message too short or not a search query"],
            )

        if not should_rewrite:
            return RewriteResult(
                original=original,
                rewritten=original,
                was_rewritten=False,
                intent=intent,
                confidence=1.0,
                rewrite_method="not_needed",
                warnings=["Message too short or not a search query"],
            )

        if not DataSourceMap.is_llm_rewrite_candidate(intent):
            rewritten = _apply_template(original, intent, pet_context)
            method = "template" if rewritten != original else "original"
            return RewriteResult(
                original=original,
                rewritten=rewritten,
                was_rewritten=(rewritten != original),
                intent=intent,
                confidence=0.80,
                rewrite_method=method,
                warnings=[],
            )

        rewritten = _apply_template(original, intent, pet_context)

        if self._client is None:
            return RewriteResult(
                original=original,
                rewritten=rewritten,
                was_rewritten=(rewritten != original),
                intent=intent,
                confidence=0.75,
                rewrite_method="template_fallback",
                warnings=["LLM unavailable - using template rewrite"],
            )

        try:
            llm_result = self._llm_rewrite(original, rewritten, pet_context)
            if llm_result and llm_result.get("rewritten_query"):
                final_query = llm_result["rewritten_query"]
                confidence = llm_result.get("confidence", 0.8)

                if confidence < 0.5:
                    warnings.append(
                        f"LLM confidence low ({confidence:.2f}) - reverting to template"
                    )
                    final_query = rewritten
                    confidence = 0.75
                    llm_result = None

                return RewriteResult(
                    original=original,
                    rewritten=final_query,
                    was_rewritten=True,
                    intent=intent,
                    confidence=confidence,
                    llm_raw_response=llm_result,
                    rewrite_method="llm",
                    warnings=warnings,
                )
        except Exception as e:
            logger.warning("LLM rewrite failed: %s - falling back to template", e)
            warnings.append(f"LLM rewrite failed: {e} - using template")

        return RewriteResult(
            original=original,
            rewritten=rewritten,
            was_rewritten=(rewritten != original),
            intent=intent,
            confidence=0.75,
            rewrite_method="template_fallback",
            warnings=warnings,
        )

    def _llm_rewrite(
        self,
        original: str,
        template_result: str,
        pet_context: "PetContext",
    ) -> Optional[dict]:
        lang = _detect_language(original)
        system_prompt = _LLM_SYSTEM_VI if lang == "vi" else _LLM_SYSTEM_EN

        pet_info = pet_context.format_for_prompt()
        user_prompt = f"""Original user question: {original}
Pet context: {pet_info}
Template-based rewrite: {template_result}
Language: {lang}

Rewrite the original question for optimal RAG vector search."""


        response = self._client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=LLM_MAX_TOKENS,
            temperature=LLM_TEMPERATURE,
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content or "{}"
        usage = response.usage

        try:
            parsed = json.loads(raw)
            result = {
                "rewritten_query": parsed.get("rewritten_query", template_result),
                "added_context": parsed.get("added_context", ""),
                "search_terms": parsed.get("search_terms", []),
                "confidence": parsed.get("confidence", 0.8),
                "language": lang,
                "llm_usage": {
                    "input_tokens": usage.prompt_tokens if usage else 0,
                    "output_tokens": usage.completion_tokens if usage else 0,
                },
            }
            logger.info(
                "LLM rewrite: '%s' -> '%s' (conf=%.2f)",
                original[:50],
                result["rewritten_query"][:50],
                result["confidence"],
            )
            return result
        except (json.JSONDecodeError, Exception) as e:
            logger.error("Failed to parse LLM rewrite response: %s. Raw: %s", e, raw)
            return None

    def rewrite_for_test(self, message: str, intent: Intent, pet_context: "PetContext") -> RewriteResult:
        return self.rewrite(message, intent, pet_context)


query_rewriter = QueryRewriter()
