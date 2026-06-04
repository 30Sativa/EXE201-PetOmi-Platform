using System;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public class ChatMessage
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
    public int? ChunksUsed { get; set; }
    public string? Model { get; set; }
    public string? SourcesJson { get; set; }
    public int TokensInput { get; set; }
    public int TokensOutput { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }

    public virtual Conversation? Conversation { get; set; }
}
