using MediatR;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.Application.Features.Chat.Command;
using PetOmiPlatform.Application.Features.Chat.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace PetOmiPlatform.API.Controllers;

[Route("api/chat/webhook")]
[ApiController]
public class ChatWebhookController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IChatResponseBroadcaster _broadcaster;
    private readonly string? _webhookSecret;

    public ChatWebhookController(
        IMediator mediator,
        IChatResponseBroadcaster broadcaster,
        Microsoft.Extensions.Configuration.IConfiguration configuration)
    {
        _mediator = mediator;
        _broadcaster = broadcaster;
        _webhookSecret = configuration["AiService:WebhookSecret"];
    }

    [HttpPost("ai-response")]
    public async Task<IActionResult> AiResponseWebhook([FromBody] AiResponseWebhookRequest request)
    {
        if (!string.IsNullOrEmpty(_webhookSecret)
            && (!Request.Headers.TryGetValue("X-Webhook-Secret", out var providedSecret)
                || providedSecret != _webhookSecret))
        {
            return Unauthorized(new { error = "Invalid webhook secret." });
        }

        try
        {
            var sources = new List<SourceEntryDto>();
            if (request.Sources != null)
            {
                foreach (var s in request.Sources)
                {
                    sources.Add(new SourceEntryDto
                    {
                        Url = s.Url ?? "",
                        Title = s.Title ?? "",
                        Snippet = s.Snippet ?? ""
                    });
                }
            }

            var aiMessage = await _mediator.Send(new CreateAiResponseCommand(
                SourceMessageId: request.MessageId,
                ConversationId: request.ConversationId,
                Response: request.Response,
                Status: request.Status,
                ErrorMessage: request.ErrorMessage,
                Intent: request.Intent,
                UrgencyLevel: request.UrgencyLevel,
                RagUsed: request.RagUsed,
                ChunksUsed: request.ChunksUsed ?? 0,
                VetRecommendation: request.VetRecommendation,
                Model: request.Model,
                TokensInput: request.TokensInput ?? 0,
                TokensOutput: request.TokensOutput ?? 0,
                Sources: sources
            ));

            var responsePayload = (ChatMessageResponse)aiMessage;

            await _broadcaster.SendToUserAsync(
                userId: request.UserId.ToString(),
                method: "ai-response",
                payload: responsePayload
            );

            return Ok(new { success = true, messageId = responsePayload.MessageId });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}

public class AiResponseWebhookRequest
{
    [JsonPropertyName("message_id")]
    public Guid MessageId { get; set; }
    [JsonPropertyName("user_id")]
    public Guid UserId { get; set; }
    [JsonPropertyName("conversation_id")]
    public Guid ConversationId { get; set; }
    [JsonPropertyName("response")]
    public string? Response { get; set; }
    [JsonPropertyName("intent")]
    public string? Intent { get; set; }
    [JsonPropertyName("urgency_level")]
    public string? UrgencyLevel { get; set; }
    [JsonPropertyName("rag_used")]
    public bool RagUsed { get; set; }
    [JsonPropertyName("chunks_used")]
    public int? ChunksUsed { get; set; }
    [JsonPropertyName("vet_recommendation")]
    public string? VetRecommendation { get; set; }
    [JsonPropertyName("model")]
    public string? Model { get; set; }
    [JsonPropertyName("tokens_input")]
    public int? TokensInput { get; set; }
    [JsonPropertyName("tokens_output")]
    public int? TokensOutput { get; set; }
    [JsonPropertyName("sources")]
    public List<SourceEntryDto>? Sources { get; set; }
    [JsonPropertyName("status")]
    public string? Status { get; set; }
    [JsonPropertyName("error_message")]
    public string? ErrorMessage { get; set; }
}
