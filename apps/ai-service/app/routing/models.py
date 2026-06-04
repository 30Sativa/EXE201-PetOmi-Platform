from pydantic import BaseModel, Field
from typing import Optional
from app.routing.intents import Intent, UrgencyLevel, RoutingSource


class RoutingResult(BaseModel):
    intent: Intent
    confidence: float = Field(..., ge=0.0, le=1.0)
    urgency_level: UrgencyLevel
    routing_source: RoutingSource
    reasoning: str = ""
    matched_keywords: list[str] = Field(default_factory=list)
    llm_raw_response: Optional[dict] = None

    def is_confident(self) -> bool:
        return self.confidence >= 0.70


class LlmClassificationResponse(BaseModel):
    intent: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    urgency_level: str = Field(..., pattern="^(critical|high|normal)$")
    reasoning: str = ""


class RoutingContext(BaseModel):
    message: str
    pet_id: Optional[str] = None
    pet_type: Optional[str] = None
    pet_age: Optional[str] = None
    pet_breed: Optional[str] = None
    language: str = "vi"
    conversation_history: list[str] = Field(default_factory=list)

    def detected_language(self) -> str:
        vi_chars = "àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ"
        msg_lower = self.message.lower()
        vi_char_count = sum(1 for c in msg_lower if c in vi_chars)
        total_chars = len([c for c in msg_lower if c.isalpha()])
        if total_chars > 0 and (vi_char_count / total_chars) > 0.3:
            return "vi"
        return "en"
