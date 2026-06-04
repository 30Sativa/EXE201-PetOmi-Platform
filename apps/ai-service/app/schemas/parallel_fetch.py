from pydantic import BaseModel, Field
from typing import Optional


class ParallelFetchRequest(BaseModel):
    user_id: str = Field(..., description="UUID of the user")
    conversation_id: str = Field(..., description="UUID of the conversation")
    pet_id: Optional[str] = Field(None, description="Optional UUID of the pet")
    original_query: str = Field(..., min_length=1, max_length=10000, description="Original user message")
    rewritten_query: Optional[str] = Field(None, description="Query rewritten by LLM (for RAG search)")
    intent: Optional[str] = Field(None, description="Detected intent for RAG topic filtering")
