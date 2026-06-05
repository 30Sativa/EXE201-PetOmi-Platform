from openai import OpenAI

from app.config import settings

OPENAI_API_KEY = settings.openai_api_key
EMBEDDING_MODEL = settings.embedding_model

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY is not configured.")

client = OpenAI(api_key=OPENAI_API_KEY)


def embed_text(text: str) -> list[float]:
    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=text
    )

    return response.data[0].embedding
