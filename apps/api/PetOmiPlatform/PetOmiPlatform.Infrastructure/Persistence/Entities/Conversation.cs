using System;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public class Conversation
{
    public Guid ConversationId { get; set; }
    public Guid UserId { get; set; }
    public Guid? PetId { get; set; }
    public string? Title { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }

    public virtual User? User { get; set; }
    public virtual Pet? Pet { get; set; }
    public virtual ICollection<ChatMessage> ChatMessages { get; set; } = new List<ChatMessage>();
}
