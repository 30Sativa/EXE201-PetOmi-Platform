using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Infrastructure.Mappers
{
    public static class PasswordResetTokenMapper
    {
        public static PasswordResetTokenDomain ToDomain(this PasswordResetToken entity)
        {
            return PasswordResetTokenDomain.Reconstitute(
                id: entity.TokenId,
                userId: entity.UserId,
                tokenHash: entity.Token,
                expiresAt: entity.ExpiresAt,
                isUsed: entity.IsUsed,
                usedAt: entity.UsedAt,
                ipAddress: entity.Ipaddress,
                createdAt: entity.CreatedAt
            );
        }

        public static PasswordResetToken ToEntity(this PasswordResetTokenDomain domain)
        {
            return new PasswordResetToken
            {
                TokenId = domain.Id,
                UserId = domain.UserId,
                Token = domain.TokenHash,
                ExpiresAt = domain.ExpiresAt,
                IsUsed = domain.IsUsed,
                UsedAt = domain.UsedAt,
                Ipaddress = domain.IpAddress,
                CreatedAt = domain.CreatedAt
            };
        }
    }
}
