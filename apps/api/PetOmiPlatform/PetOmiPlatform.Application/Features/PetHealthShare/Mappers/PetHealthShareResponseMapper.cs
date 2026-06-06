using PetOmiPlatform.Application.Features.PetHealthShare.DTOs.Response;
using PetOmiPlatform.Domain.Entities;

namespace PetOmiPlatform.Application.Features.PetHealthShare.Mappers
{
    public static class PetHealthShareResponseMapper
    {
        public static PetHealthShareResponse ToResponse(this PetHealthShareTokenDomain domain, DateTime? nowUtc = null)
        {
            var now = nowUtc ?? DateTime.UtcNow;

            return new PetHealthShareResponse
            {
                ShareTokenId = domain.Id,
                PetId = domain.PetId,
                OwnerUserId = domain.OwnerUserId,
                ClinicId = domain.ClinicId,
                DisplayCode = domain.DisplayCode,
                Scope = domain.Scope.ToString(),
                AccessMode = domain.AccessMode.ToString(),
                ExpiresAt = domain.ExpiresAt,
                MaxUses = domain.MaxUses,
                UsedCount = domain.UsedCount,
                LastUsedAt = domain.LastUsedAt,
                RevokedAt = domain.RevokedAt,
                CreatedAt = domain.CreatedAt,
                CreatedByUserId = domain.CreatedByUserId,
                Note = domain.Note,
                IsExpired = domain.IsExpired(now),
                IsRevoked = domain.IsRevoked(),
                HasReachedMaxUses = domain.HasReachedMaxUses()
            };
        }
    }
}
