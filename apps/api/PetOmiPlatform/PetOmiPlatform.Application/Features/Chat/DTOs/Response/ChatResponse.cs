using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Application.Features.Chat.DTOs.Response;

public class SourceEntryDto
{
    public string Url { get; set; } = "";
    public string Title { get; set; } = "";
    public string Snippet { get; set; } = "";
}

public class ChatMessageResponse
{
    public Guid MessageId { get; set; }
    public Guid ConversationId { get; set; }
    public string SenderRole { get; set; } = null!;
    public string Status { get; set; } = null!;
    public string Content { get; set; } = null!;
    public string? Intent { get; set; }
    public string? UrgencyLevel { get; set; }
    public string? VetRecommendation { get; set; }
    public bool RagUsed { get; set; }
    public int ChunksUsed { get; set; }
    public string? Model { get; set; }
    public int TokensInput { get; set; }
    public int TokensOutput { get; set; }
    public List<SourceEntryDto> Sources { get; set; } = new();
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class SendChatMessageResponse
{
    public Guid MessageId { get; set; }
    public Guid ConversationId { get; set; }
    public string Status { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}

public class ChatConversationResponse
{
    public Guid ConversationId { get; set; }
    public Guid UserId { get; set; }
    public Guid? PetId { get; set; }
    public string? Title { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
