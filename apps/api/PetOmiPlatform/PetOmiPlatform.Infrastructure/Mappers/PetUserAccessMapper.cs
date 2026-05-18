using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;

namespace PetOmiPlatform.Infrastructure.Mappers
{
    public static class PetUserAccessMapper
    {
        public static PetUserAccessDomain ToDomain(this PetUserAccess entity)
        {
            return PetUserAccessDomain.Reconstitute(
                id: entity.PetUserAccessId,
                petId: entity.PetId,
                userId: entity.UserId,
                accessRole: entity.AccessRole,
                grantedByUserId: entity.GrantedByUserId,
                expiresAt: entity.ExpiresAt,
                revokedAt: entity.RevokedAt,
                isActive: entity.IsActive,
                createdAt: entity.CreatedAt,
                updatedAt: entity.UpdatedAt
            );
        }

        public static PetUserAccess ToEntity(this PetUserAccessDomain domain)
        {
            return new PetUserAccess
            {
                PetUserAccessId = domain.Id,
                PetId = domain.PetId,
                UserId = domain.UserId,
                AccessRole = domain.AccessRole,
                GrantedByUserId = domain.GrantedByUserId,
                ExpiresAt = domain.ExpiresAt,
                RevokedAt = domain.RevokedAt,
                IsActive = domain.IsActive,
                CreatedAt = domain.CreatedAt,
                UpdatedAt = domain.UpdatedAt
            };
        }
    }
}
