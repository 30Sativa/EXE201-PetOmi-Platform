using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Common.Enums;
using System;

namespace PetOmiPlatform.Domain.Entities;

public class ChatMessageDomain : BaseEntity
{
    public Guid ConversationId { get; private set; }
    public SenderRole SenderRole { get; private set; }
    public MessageStatus Status { get; private set; }
    public string Content { get; private set; }
    public string? Intent { get; private set; }
    public string? UrgencyLevel { get; private set; }
    public string? VetRecommendation { get; private set; }
    public bool RagUsed { get; private set; }
    public int ChunksUsed { get; private set; }
    public string? Model { get; private set; }
    public string? SourcesJson { get; private set; }
    public int TokensInput { get; private set; }
    public int TokensOutput { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? DeletedAt { get; private set; }

    private ChatMessageDomain() { }

    public static ChatMessageDomain CreateUserMessage(
        Guid conversationId,
        string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            throw new ArgumentException("Message content cannot be empty.");

        return new ChatMessageDomain
        {
            Id = Guid.NewGuid(),
            ConversationId = conversationId,
            SenderRole = SenderRole.User,
            Status = MessageStatus.Pending,
            Content = content.Trim(),
            Intent = null,
            UrgencyLevel = null,
            VetRecommendation = null,
            RagUsed = false,
            ChunksUsed = 0,
            Model = null,
            TokensInput = 0,
            TokensOutput = 0,
            IsActive = true,
            DeletedAt = null,
            CreatedAt = DateTime.UtcNow
        };
    }

    public static ChatMessageDomain CreateAiResponse(
        Guid conversationId,
        string content,
        string? intent = null,
        string? urgencyLevel = null,
        bool ragUsed = false,
        int chunksUsed = 0,
        string? model = null,
        int tokensInput = 0,
        int tokensOutput = 0,
        string? vetRecommendation = null,
        string? sourcesJson = null)
    {
        return new ChatMessageDomain
        {
            Id = Guid.NewGuid(),
            ConversationId = conversationId,
            SenderRole = SenderRole.AI,
            Status = MessageStatus.Completed,
            Content = content,
            Intent = intent,
            UrgencyLevel = urgencyLevel,
            VetRecommendation = vetRecommendation,
            RagUsed = ragUsed,
            ChunksUsed = chunksUsed,
            Model = model,
            SourcesJson = sourcesJson,
            TokensInput = tokensInput,
            TokensOutput = tokensOutput,
            IsActive = true,
            DeletedAt = null,
            CreatedAt = DateTime.UtcNow
        };
    }

    public static ChatMessageDomain CreateAiErrorResponse(
        Guid conversationId,
        string content,
        string? intent = null,
        string? urgencyLevel = null)
    {
        return new ChatMessageDomain
        {
            Id = Guid.NewGuid(),
            ConversationId = conversationId,
            SenderRole = SenderRole.AI,
            Status = MessageStatus.Failed,
            Content = content,
            Intent = intent,
            UrgencyLevel = urgencyLevel,
            VetRecommendation = null,
            RagUsed = false,
            ChunksUsed = 0,
            Model = null,
            SourcesJson = null,
            TokensInput = 0,
            TokensOutput = 0,
            IsActive = true,
            DeletedAt = null,
            CreatedAt = DateTime.UtcNow
        };
    }

    public static ChatMessageDomain Reconstitute(
        Guid id,
        Guid conversationId,
        SenderRole senderRole,
        MessageStatus status,
        string content,
        string? intent,
        string? urgencyLevel,
        string? vetRecommendation,
        bool ragUsed,
        int chunksUsed,
        string? model,
        string? sourcesJson,
        int tokensInput,
        int tokensOutput,
        bool isActive,
        DateTime createdAt,
        DateTime? deletedAt)
    {
        return new ChatMessageDomain
        {
            Id = id,
            ConversationId = conversationId,
            SenderRole = senderRole,
            Status = status,
            Content = content,
            Intent = intent,
            UrgencyLevel = urgencyLevel,
            VetRecommendation = vetRecommendation,
            RagUsed = ragUsed,
            ChunksUsed = chunksUsed,
            Model = model,
            SourcesJson = sourcesJson,
            TokensInput = tokensInput,
            TokensOutput = tokensOutput,
            IsActive = isActive,
            CreatedAt = createdAt,
            DeletedAt = deletedAt
        };
    }

    public void SoftDelete()
    {
        if (!IsActive) return;
        IsActive = false;
        DeletedAt = DateTime.UtcNow;
    }

    public void MarkProcessing()
    {
        Status = MessageStatus.Processing;
    }

    public void MarkCompleted()
    {
        Status = MessageStatus.Completed;
    }

    public void MarkFailed()
    {
        Status = MessageStatus.Failed;
    }

    public void MarkCancelled()
    {
        Status = MessageStatus.Cancelled;
    }
}
