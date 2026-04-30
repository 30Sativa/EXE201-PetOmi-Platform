using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Exceptions;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Domain.Entities
{
    public class RefreshTokensDomain : BaseEntity
    {
        public Guid UserId { get; private set; }

        public string TokenHash { get; private set; }
        public DateTime ExpiresAt { get; private set; }

        public bool IsRevoked { get; private set; }
        public DateTime? RevokedAt { get; private set; }

        public Guid? ReplacedByTokenId { get; private set; }

        public DateTime CreatedAt { get; private set; }
        public DateTime? LastUsedAt { get; private set; }


        // === Constructors ===
        // Private constructor for EF Core and reconstitution
        private RefreshTokensDomain() { }


        private RefreshTokensDomain(Guid userId, string tokenHash, DateTime expiresAt)
        {
            Id = Guid.NewGuid();
            UserId = userId;
            TokenHash = tokenHash;
            ExpiresAt = expiresAt;
            IsRevoked = false;
            ReplacedByTokenId = null;
            CreatedAt = DateTime.UtcNow;
        }

        public static RefreshTokensDomain Reconstitute(
            Guid id,
            Guid userId,
            string tokenHash,
            DateTime expiresAt,
            bool isRevoked,
            DateTime? revokedAt,
            Guid? replacedByTokenId,
            DateTime createdAt,
            DateTime? lastUsedAt)
        {
            var token = new RefreshTokensDomain
            {
                Id = id,
                UserId = userId,
                TokenHash = tokenHash,
                ExpiresAt = expiresAt,
                IsRevoked = isRevoked,
                RevokedAt = revokedAt,
                ReplacedByTokenId = replacedByTokenId,
                CreatedAt = createdAt,
                LastUsedAt = lastUsedAt
            };
            return token;
        }


        //=== Factory method for creating a new refresh token ===


        //=== Behavior Methods (Domain Logic) ===


        public bool IsExpired()
        {
            return DateTime.UtcNow >= ExpiresAt;
        }

        public bool IsActive()
        {
            return !IsRevoked && !IsExpired();
        }

        // Khi token được sử dụng để lấy access token mới, chúng ta sẽ đánh dấu thời điểm sử dụng cuối cùng.
        // Điều này giúp theo dõi hoạt động của token và phát hiện các hành vi bất thường (ví dụ: token bị sử dụng lại sau khi đã bị thu hồi).
        public void MarkAsUsed()
        {
            if (!IsActive())
            {
                throw new DomainException("Không thể sử dụng một token đã bị thu hồi hoặc đã hết hạn.");
            }
            LastUsedAt = DateTime.UtcNow;
        }


        public void Revoke()
        {
            if (IsRevoked) return;

            IsRevoked = true;
            RevokedAt = DateTime.UtcNow;
        }

        // Thay thế token hiện tại bằng một token mới, đồng thời thu hồi token cũ. Điều này giúp ngăn chặn việc sử dụng lại token cũ (tấn công tái sử dụng).
        public void ReplaceBy(Guid newTokenId)
        {
            if(IsRevoked)
            {
                throw new DomainException("Không thể thay thế một token đã bị thu hồi."); 
            }
            ReplacedByTokenId = newTokenId;
            Revoke();
        }

        // Dùng để kiểm tra nếu token đã bị thu hồi và có token thay thế, có thể là dấu hiệu của một cuộc tấn công tái sử dụng token
        public bool IsReuseAttack()
        {
            return IsRevoked && ReplacedByTokenId != null;
        }
        // Dùng để kiểm tra nếu token đã bị sử dụng lại sau khi bị thu hồi (tấn công tái sử dụng)
        public void EnsureValid()
        {
            if (IsRevoked)
                throw new Exception("Token revoked");

            if (IsExpired())
                throw new Exception("Token expired");
        }

    }
}
