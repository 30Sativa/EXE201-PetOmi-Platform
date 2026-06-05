using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;

namespace PetOmiPlatform.Infrastructure.Mappers
{
    public static class ChatMessageMapper
    {
        public static ChatMessageDomain ToDomain(this ChatMessage entity)
        {
            var senderRole = entity.SenderRole.Equals("assistant", StringComparison.OrdinalIgnoreCase)
                ? SenderRole.AI
                : Enum.TryParse<SenderRole>(entity.SenderRole, true, out var sr)
                    ? sr
                    : SenderRole.User;

            var status = Enum.TryParse<MessageStatus>(entity.Status, true, out var parsedStatus)
                ? parsedStatus
                : MessageStatus.Pending;

            return ChatMessageDomain.Reconstitute(
                id: entity.MessageId,
                conversationId: entity.ConversationId,
                senderRole: senderRole,
                status: status,
                content: entity.Content,
                intent: entity.Intent,
                urgencyLevel: entity.UrgencyLevel,
                vetRecommendation: entity.VetRecommendation,
                ragUsed: entity.RagUsed,
                chunksUsed: entity.ChunksUsed ?? 0,
                model: entity.Model,
                sourcesJson: entity.SourcesJson,
                tokensInput: entity.TokensInput,
                tokensOutput: entity.TokensOutput,
                isActive: entity.IsActive,
                createdAt: entity.CreatedAt,
                deletedAt: entity.DeletedAt
            );
        }

        public static ChatMessage ToEntity(this ChatMessageDomain domain)
        {
            return new ChatMessage
            {
                MessageId = domain.Id,
                ConversationId = domain.ConversationId,
                SenderRole = domain.SenderRole == SenderRole.AI ? "assistant" : domain.SenderRole.ToString().ToLowerInvariant(),
                Status = domain.Status.ToString().ToLowerInvariant(),
                Content = domain.Content,
                Intent = domain.Intent,
                UrgencyLevel = domain.UrgencyLevel,
                VetRecommendation = domain.VetRecommendation,
                RagUsed = domain.RagUsed,
                ChunksUsed = domain.ChunksUsed,
                Model = domain.Model,
                SourcesJson = domain.SourcesJson,
                TokensInput = domain.TokensInput,
                TokensOutput = domain.TokensOutput,
                IsActive = domain.IsActive,
                CreatedAt = domain.CreatedAt,
                DeletedAt = domain.DeletedAt
            };
        }
    }
}
