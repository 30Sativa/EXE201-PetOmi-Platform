from pydantic import BaseModel, Field
from typing import Optional


class SourceEntry(BaseModel):
    url: str = ""
    title: str = ""
    snippet: str = ""


class AiWebhookPayload(BaseModel):
    message_id: str
    user_id: str
    conversation_id: str
    response: str
    intent: Optional[str] = None
    urgency_level: Optional[str] = None
    rag_used: bool = False
    chunks_used: Optional[int] = 0
    sources: list[SourceEntry] = Field(default_factory=list)
    vet_recommendation: Optional[str] = None
    model: Optional[str] = None
    tokens_input: Optional[int] = 0
    tokens_output: Optional[int] = 0
    status: str = "completed"
    error_message: Optional[str] = None


class ChatProcessResponse(BaseModel):
    status: str = "queued"
    message_id: str
    conversation_id: str
