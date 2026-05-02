using PetOmiPlatform.Domain.Common;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Domain.Entities
{
    public class UserSessionDomain : BaseEntity
    {
        public Guid UserId { get; private set; }
        public Guid? DeviceId { get; private set; }
        public Guid? RefreshTokenId { get; private set; }
        public bool IsActive { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public DateTime LastActivityAt { get; private set; }
        public DateTime? LogoutAt { get; private set; }

        private UserSessionDomain() { }





        public static UserSessionDomain Reconstitute(
        Guid id, Guid userId, Guid? deviceId,
        Guid? refreshTokenId,
        bool isActive, DateTime createdAt,
        DateTime lastActivityAt, DateTime? logoutAt)
        {
            return new UserSessionDomain
            {
                Id = id,
                UserId = userId,
                DeviceId = deviceId,
                RefreshTokenId = refreshTokenId,
                IsActive = isActive,
                CreatedAt = createdAt,
                LastActivityAt = lastActivityAt,
                LogoutAt = logoutAt
            };
        }



        public static UserSessionDomain Create(Guid userId, Guid? deviceId)
        {
            return new UserSessionDomain
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                DeviceId = deviceId,
                RefreshTokenId = null,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                LastActivityAt = DateTime.UtcNow
            };
        }


        //Behavior methods
        public void AssignToken(Guid tokenId)
        {
            RefreshTokenId = tokenId;
            LastActivityAt = DateTime.UtcNow;
        }
        public void Revoke()
        {
            IsActive = false;
            RefreshTokenId = null;
            LogoutAt = DateTime.UtcNow;
        }

        public void UpdateActivity()
        {
            LastActivityAt = DateTime.UtcNow;
        }


    }
}
