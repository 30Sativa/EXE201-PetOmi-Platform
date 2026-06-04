import json
import logging
from typing import Optional

from openai import OpenAI
from openai import BadRequestError

from app.config import settings
from app.routing.intents import Intent, UrgencyLevel
from app.routing.models import RoutingResult, RoutingContext, RoutingSource, LlmClassificationResponse

logger = logging.getLogger(__name__)

LLM_MODEL = "gpt-4o-mini"
LLM_MAX_TOKENS = 256
LLM_TEMPERATURE = 0.0

SYSTEM_PROMPT_VI = """Bạn là chuyên gia phân loại ý định cho nền tảng chăm sóc thú cưng PetOmi.

Hãy phân loại tin nhắn của người dùng thành MỘT trong các intent sau:
- **appointment**: Đặt lịch khám thú y, đặt lịch tiêm, hẹn giờ
- **nutrition**: Thức ăn, dinh dưỡng, cho ăn, vitamin, thực phẩm bổ sung
- **symptom**: Triệu chứng bệnh, triệu chứng sức khỏe, điều trị
- **vaccine**: Tiêm phòng, vắc xin, lịch tiêm
- **emergency**: Tình huống nguy hiểm tính mạng, ngộ độc, co giật, khó thở
- **billing**: Giá cả, chi phí, thanh toán, bảo hiểm
- **grooming**: Tắm, chải lông, cắt móng, vệ sinh
- **training**: Huấn luyện, dạy lệnh, điều chỉnh hành vi
- **behavior**: Cảm xúc, vấn đề hành vi, ngôn ngữ cơ thể
- **product**: Sản phẩm, đồ dùng, thiết bị cho thú cưng
- **general**: Chào hỏi, trò chuyện chung

QUY TẮC:
- Nếu tin nhắn nói về triệu chứng nguy hiểm tính mạng → intent=emergency, urgency_level=critical
- Nếu tin nhắn nói về triệu chứng nhưng không nguy hiểm → intent=symptom, urgency_level=high
- Nếu chỉ là chào hỏi hoặc hỏi chung → intent=general
- confidence nên phản ánh mức độ chắc chắn (1.0 = rất chắc, 0.5 = không chắc)
- urgency_level chỉ là critical khi có nguy hiểm tính mạng

Trả lời đúng format JSON:
{"intent": "...", "confidence": 0.0-1.0, "urgency_level": "critical|high|normal", "reasoning": "..."}"""

SYSTEM_PROMPT_EN = """You are an expert pet care intent classifier for the PetOmi platform.

Classify the user message into ONE of these intents:
- **appointment**: Vet appointment scheduling, booking time slots
- **nutrition**: Food, diet, feeding, vitamins, supplements
- **symptom**: Health symptoms, diseases, medical concerns
- **vaccine**: Vaccinations, immunization, booster shots
- **emergency**: Life-threatening situations, poisonings, seizures, difficulty breathing
- **billing**: Prices, costs, payments, insurance
- **grooming**: Bathing, fur care, nail trimming, hygiene
- **training**: Obedience training, commands, behavior correction
- **behavior**: Emotional issues, behavioral problems, body language
- **product**: Pet supplies, toys, equipment
- **general**: Greetings, general conversation

RULES:
- Life-threatening symptoms → intent=emergency, urgency_level=critical
- Symptoms but not critical → intent=symptom, urgency_level=high
- Purely greeting or small talk → intent=general
- confidence: 1.0 = very sure, 0.5 = uncertain

Return valid JSON only:
{"intent": "...", "confidence": 0.0-1.0, "urgency_level": "critical|high|normal", "reasoning": "..."}"""


class LlmIntentClassifier:
    def __init__(self) -> None:
        if not settings.openai_api_key:
            logger.warning("OPENAI_API_KEY not configured - LLM classifier will return default")
            self._client: Optional[OpenAI] = None
        else:
            self._client = OpenAI(api_key=settings.openai_api_key)

    def classify(self, context: RoutingContext) -> Optional[RoutingResult]:
        if self._client is None:
            logger.warning("LLM classifier unavailable - returning general intent")
            return self._default_result(context)

        detected_lang = context.detected_language()
        system_prompt = SYSTEM_PROMPT_VI if detected_lang == "vi" else SYSTEM_PROMPT_EN

        user_content = context.message
        if context.pet_type:
            user_content += f"\n\nPet type: {context.pet_type}"
        if context.pet_age:
            user_content += f"\nPet age: {context.pet_age}"

        try:
            response = self._client.chat.completions.create(
                model=LLM_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
                max_tokens=LLM_MAX_TOKENS,
                temperature=LLM_TEMPERATURE,
                response_format={"type": "json_object"},
            )

            raw_content = response.choices[0].message.content or "{}"
            usage = response.usage

            try:
                parsed = json.loads(raw_content)
                llm_response = LlmClassificationResponse(**parsed)
            except (json.JSONDecodeError, Exception) as e:
                logger.error("Failed to parse LLM response: %s. Raw: %s", e, raw_content)
                return self._default_result(context)

            intent = Intent(llm_response.intent.lower())

            urgency_map = {
                "critical": UrgencyLevel.CRITICAL,
                "high": UrgencyLevel.HIGH,
                "normal": UrgencyLevel.NORMAL,
            }
            urgency = urgency_map.get(llm_response.urgency_level, UrgencyLevel.NORMAL)

            logger.info(
                "LLM classified intent=%s confidence=%.2f urgency=%s",
                intent.value,
                llm_response.confidence,
                llm_response.urgency_level,
            )

            return RoutingResult(
                intent=intent,
                confidence=llm_response.confidence,
                urgency_level=urgency,
                routing_source=RoutingSource.LLM_FALLBACK,
                reasoning=llm_response.reasoning,
                matched_keywords=[],
                llm_raw_response={
                    "raw": raw_content,
                    "model": LLM_MODEL,
                    "usage": {
                        "input_tokens": usage.prompt_tokens if usage else 0,
                        "output_tokens": usage.completion_tokens if usage else 0,
                    },
                },
            )

        except BadRequestError as e:
            logger.error("OpenAI BadRequestError: %s", e)
            return self._default_result(context)
        except Exception as e:
            logger.error("LLM classification failed: %s", e)
            return self._default_result(context)

    def _default_result(self, context: RoutingContext) -> RoutingResult:
        return RoutingResult(
            intent=Intent.GENERAL,
            confidence=0.3,
            urgency_level=UrgencyLevel.NORMAL,
            routing_source=RoutingSource.DEFAULT,
            reasoning="LLM classifier unavailable or failed - defaulting to general",
            matched_keywords=[],
        )
