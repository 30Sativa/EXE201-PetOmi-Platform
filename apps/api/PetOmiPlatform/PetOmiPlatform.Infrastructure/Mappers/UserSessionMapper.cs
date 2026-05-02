using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Infrastructure.Mappers
{
    public static class UserSessionMapper
    {
        public static UserSessionDomain ToDomain(this UserSession entity)
        {
            return UserSessionDomain.Reconstitute(
                id: entity.SessionId,
                userId: entity.UserId,
                deviceId: entity.DeviceId,
                refreshTokenId: entity.RefreshTokenId,
                isActive: entity.IsActive,
                createdAt: entity.CreatedAt,
                lastActivityAt: entity.LastActivityAt,
                logoutAt: entity.LogoutAt
            );
        }

        public static UserSession ToEntity(this UserSessionDomain domain)
        {
            return new UserSession
            {
                SessionId = domain.Id,
                UserId = domain.UserId,
                DeviceId = domain.DeviceId,
                RefreshTokenId = domain.RefreshTokenId,
                IsActive = domain.IsActive,
                CreatedAt = domain.CreatedAt,
                LastActivityAt = domain.LastActivityAt,
                LogoutAt = domain.LogoutAt
            };
        }
    }
}
