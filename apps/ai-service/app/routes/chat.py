import logging
from fastapi import APIRouter, BackgroundTasks, HTTPException, status

from app.schemas.request import ChatProcessRequest
from app.schemas.response import ChatProcessResponse, AiWebhookPayload
from app.chat.chat_service import process_message

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/chat",
    tags=["Chat"]
)


@router.post("/process", response_model=ChatProcessResponse)
async def process_chat_message(
    request: ChatProcessRequest,
    background_tasks: BackgroundTasks,
):
    """
    Receives a chat message from the .NET API and queues it for processing.
    Returns immediately (202 Accepted) while the AI processes in the background.
    """
    logger.info(
        "Received chat message. MessageId: %s, ConversationId: %s, UserId: %s",
        request.message_id,
        request.conversation_id,
        request.user_id,
    )

    background_tasks.add_task(_process_in_background, request)

    return ChatProcessResponse(
        status="queued",
        message_id=request.message_id,
        conversation_id=request.conversation_id,
    )


async def _process_in_background(request: ChatProcessRequest) -> None:
    """
    Runs in background - calls OpenAI and notifies .NET API via webhook.
    On failure, sends an error webhook so .NET can mark the message as failed.
    """
    try:
        await process_message(request)
    except Exception as e:
        logger.error(
            "Background processing failed for message %s: %s",
            request.message_id,
            str(e),
        )
        await _send_error_webhook(request, str(e))


async def _send_error_webhook(request: ChatProcessRequest, error_message: str) -> None:
    """
    Sends an error webhook to .NET so the message can be marked as failed.
    """
    from app.config import settings
    import httpx

    payload = AiWebhookPayload(
        message_id=request.message_id,
        user_id=request.user_id,
        conversation_id=request.conversation_id,
        response="",
        status="failed",
        error_message=error_message,
    )

    headers = {}
    if settings.dotnet_api_webhook_secret:
        headers["X-Webhook-Secret"] = settings.dotnet_api_webhook_secret

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                request.webhook_url,
                json=payload.model_dump(mode="json"),
                headers=headers,
            )
            response.raise_for_status()
            logger.info(
                "Error webhook delivered for message %s.",
                request.message_id,
            )
    except httpx.HTTPStatusError as e:
        logger.warning(
            "Error webhook failed for message %s. Status: %s.",
            request.message_id,
            e.response.status_code,
        )
    except Exception as webhook_e:
        logger.warning(
            "Error webhook exception for message %s: %s",
            request.message_id,
            webhook_e,
        )
