using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Infrastructure.Mappers
{
    public static class EmailVerificationTokenMapper
    {
        public static EmailVerificationTokenDomain ToDomain(this EmailVerificationToken entity)
        {
            return EmailVerificationTokenDomain.Reconstitute(
                id: entity.VerificationTokenId,
                userId: entity.UserId,
                tokenHash: entity.Token,
                expiresAt: entity.ExpiresAt,
                isUsed: entity.IsUsed,
                createdAt: entity.CreatedAt,
                usedAt: null
            );
        }

        public static EmailVerificationToken ToEntity(this EmailVerificationTokenDomain domain)
        {
            return new EmailVerificationToken
            {
                VerificationTokenId = domain.Id,
                UserId = domain.UserId,
                Token = domain.TokenHash,
                ExpiresAt = domain.ExpiresAt,
                IsUsed = domain.IsUsed,
                CreatedAt = domain.CreatedAt
            };
        }
    }
}
