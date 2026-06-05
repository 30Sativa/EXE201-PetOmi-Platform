using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;

namespace PetOmiPlatform.Infrastructure.Mappers
{
    public static class ConversationMapper
    {
        public static ConversationDomain ToDomain(this Conversation entity)
        {
            return ConversationDomain.Reconstitute(
                id: entity.ConversationId,
                userId: entity.UserId,
                petId: entity.PetId,
                title: entity.Title,
                isActive: entity.IsActive,
                createdAt: entity.CreatedAt,
                updatedAt: entity.UpdatedAt,
                deletedAt: entity.DeletedAt
            );
        }

        public static Conversation ToEntity(this ConversationDomain domain)
        {
            return new Conversation
            {
                ConversationId = domain.Id,
                UserId = domain.UserId,
                PetId = domain.PetId,
                Title = domain.Title,
                IsActive = domain.IsActive,
                CreatedAt = domain.CreatedAt,
                UpdatedAt = domain.UpdatedAt,
                DeletedAt = domain.DeletedAt
            };
        }
    }
}
