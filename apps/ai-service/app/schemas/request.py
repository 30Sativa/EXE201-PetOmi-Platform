from pydantic import BaseModel, Field
from typing import Optional


class ChatProcessRequest(BaseModel):
    message_id: str = Field(..., description="UUID of the chat message")
    conversation_id: str = Field(..., description="UUID of the conversation")
    user_id: str = Field(..., description="UUID of the user")
    content: str = Field(..., min_length=1, max_length=10000)
    pet_id: Optional[str] = Field(None, description="Optional UUID of the pet context")
    webhook_url: str = Field(..., description="URL to call back with the AI response")
