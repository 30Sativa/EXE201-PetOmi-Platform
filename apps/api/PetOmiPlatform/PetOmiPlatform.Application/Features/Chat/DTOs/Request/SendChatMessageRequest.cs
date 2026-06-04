namespace PetOmiPlatform.Application.Features.Chat.DTOs.Request;

public class SendChatMessageRequest
{
    public string Content { get; set; } = null!;
    public Guid? ConversationId { get; set; }
    public Guid? PetId { get; set; }
}
