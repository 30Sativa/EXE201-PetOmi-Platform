using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Infrastructure.Mappers
{
    public static class RefreshTokenMapper
    {
        //EF entities -> Domain
        public static RefreshTokensDomain ToDomain(this RefreshToken entity)
        {
            return RefreshTokensDomain.Reconstitute(
                id: entity.RefreshTokenId,
                userId: entity.UserId,
                tokenHash: entity.TokenHash,
                expiresAt: entity.ExpiresAt,
                isRevoked: entity.IsRevoked,
                revokedAt: entity.RevokedAt,
                replacedByTokenId: entity.ReplacedByToken,
                createdAt: entity.CreatedAt,
                lastUsedAt: entity.LastUsedAt
                );
        }

        //Domain -> EF core
        public static RefreshToken ToEntity(this RefreshTokensDomain domain) 
        {
            return new RefreshToken
            {
                RefreshTokenId = domain.Id,
                UserId = domain.UserId,
                TokenHash = domain.TokenHash,
                ExpiresAt = domain.ExpiresAt,
                IsRevoked = domain.IsRevoked,
                ReplacedByToken = domain.ReplacedByTokenId,
                CreatedAt = domain.CreatedAt,
                LastUsedAt = domain.LastUsedAt
            };
        }
    }
}   
