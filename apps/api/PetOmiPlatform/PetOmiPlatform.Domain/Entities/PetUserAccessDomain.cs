using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Exceptions;
using System;

namespace PetOmiPlatform.Domain.Entities
{
    public class PetUserAccessDomain : BaseEntity
    {
        public Guid PetId { get; private set; }
        public Guid UserId { get; private set; }
        public string AccessRole { get; private set; }
        public Guid? GrantedByUserId { get; private set; }
        public DateTime? ExpiresAt { get; private set; }
        public DateTime? RevokedAt { get; private set; }
        public bool IsActive { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public DateTime? UpdatedAt { get; private set; }

        private static readonly string[] ValidRoles = { "Owner", "Editor", "Viewer" };

        private PetUserAccessDomain() { }

        private PetUserAccessDomain(
            Guid petId,
            Guid userId,
            string accessRole,
            Guid? grantedByUserId,
            DateTime? expiresAt)
        {
            Id = Guid.NewGuid();
            PetId = petId;
            UserId = userId;
            AccessRole = accessRole;
            GrantedByUserId = grantedByUserId;
            ExpiresAt = expiresAt;
            IsActive = true;
            CreatedAt = DateTime.UtcNow;
        }

        public static PetUserAccessDomain Create(
            Guid petId,
            Guid userId,
            string accessRole,
            Guid? grantedByUserId,
            DateTime? expiresAt)
        {
            ValidateAccessRole(accessRole);
            ValidateNotExpired(expiresAt);
            if (petId == userId)
                throw new DomainException("Không thể tự cấp quyền truy cập cho chính mình.");
            return new PetUserAccessDomain(petId, userId, accessRole, grantedByUserId, expiresAt);
        }

        public static PetUserAccessDomain Reconstitute(
            Guid id,
            Guid petId,
            Guid userId,
            string accessRole,
            Guid? grantedByUserId,
            DateTime? expiresAt,
            DateTime? revokedAt,
            bool isActive,
            DateTime createdAt,
            DateTime? updatedAt)
        {
            return new PetUserAccessDomain
            {
                Id = id,
                PetId = petId,
                UserId = userId,
                AccessRole = accessRole,
                GrantedByUserId = grantedByUserId,
                ExpiresAt = expiresAt,
                RevokedAt = revokedAt,
                IsActive = isActive,
                CreatedAt = createdAt,
                UpdatedAt = updatedAt
            };
        }

        public void Revoke()
        {
            if (!IsActive)
                throw new DomainException("Quyền truy cập này đã bị thu hồi trước đó.");
            IsActive = false;
            RevokedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }

        public bool IsExpired()
        {
            return ExpiresAt.HasValue && ExpiresAt.Value < DateTime.UtcNow;
        }

        public bool CanRead() => AccessRole is "Owner" or "Editor" or "Viewer" && IsActive && !IsExpired();
        public bool CanWrite() => AccessRole is "Owner" or "Editor" && IsActive && !IsExpired();

        private static void ValidateAccessRole(string accessRole)
        {
            if (!Array.Exists(ValidRoles, r => r.Equals(accessRole, StringComparison.OrdinalIgnoreCase)))
                throw new DomainException($"AccessRole không hợp lệ. Chỉ chấp nhận: {string.Join(", ", ValidRoles)}.");
        }

        private static void ValidateNotExpired(DateTime? expiresAt)
        {
            if (expiresAt.HasValue && expiresAt.Value < DateTime.UtcNow)
                throw new DomainException("Ngày hết hạn không thể là ngày trong quá khứ.");
        }
    }
}
