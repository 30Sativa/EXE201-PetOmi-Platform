using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;

namespace PetOmiPlatform.Infrastructure.Mappers
{
    public static class PetHealthShareTokenMapper
    {
        public static PetHealthShareTokenDomain ToDomain(this PetHealthShareToken entity)
        {
            return PetHealthShareTokenDomain.Reconstitute(
                id: entity.ShareTokenId,
                petId: entity.PetId,
                ownerUserId: entity.OwnerUserId,
                clinicId: entity.ClinicId,
                displayCode: entity.DisplayCode,
                tokenHash: entity.TokenHash,
                scope: Enum.Parse<PetHealthShareScope>(entity.Scope),
                accessMode: Enum.Parse<PetHealthShareAccessMode>(entity.AccessMode),
                expiresAt: entity.ExpiresAt,
                maxUses: entity.MaxUses,
                usedCount: entity.UsedCount,
                lastUsedAt: entity.LastUsedAt,
                revokedAt: entity.RevokedAt,
                createdAt: entity.CreatedAt,
                createdByUserId: entity.CreatedByUserId,
                note: entity.Note);
        }

        public static PetHealthShareToken ToEntity(this PetHealthShareTokenDomain domain)
        {
            return new PetHealthShareToken
            {
                ShareTokenId = domain.Id,
                PetId = domain.PetId,
                OwnerUserId = domain.OwnerUserId,
                ClinicId = domain.ClinicId,
                DisplayCode = domain.DisplayCode,
                TokenHash = domain.TokenHash,
                Scope = domain.Scope.ToString(),
                AccessMode = domain.AccessMode.ToString(),
                ExpiresAt = domain.ExpiresAt,
                MaxUses = domain.MaxUses,
                UsedCount = domain.UsedCount,
                LastUsedAt = domain.LastUsedAt,
                RevokedAt = domain.RevokedAt,
                CreatedAt = domain.CreatedAt,
                CreatedByUserId = domain.CreatedByUserId,
                Note = domain.Note
            };
        }
    }
}
