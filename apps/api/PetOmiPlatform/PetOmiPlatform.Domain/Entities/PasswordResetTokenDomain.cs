using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Exceptions;

namespace PetOmiPlatform.Domain.Entities
{
    public class PasswordResetTokenDomain : BaseEntity
    {
        public Guid UserId { get; private set; }

        public string TokenHash { get; private set; } = string.Empty;

        public DateTime ExpiresAt { get; private set; }

        public bool IsUsed { get; private set; }

        public DateTime? UsedAt { get; private set; }

        public string? IpAddress { get; private set; }

        public DateTime CreatedAt { get; private set; }


        // === Constructors ===

        // For EF Core
        private PasswordResetTokenDomain() { }

        private PasswordResetTokenDomain(
            Guid userId,
            string tokenHash,
            DateTime expiresAt,
            string? ipAddress)
        {
            Id = Guid.NewGuid();

            UserId = userId;

            TokenHash = tokenHash;

            ExpiresAt = expiresAt;

            IsUsed = false;

            IpAddress = ipAddress;

            CreatedAt = DateTime.UtcNow;
        }


        // === Factory Method ===

        public static PasswordResetTokenDomain Create(
            Guid userId,
            string tokenHash,
            string? ipAddress = null,
            int hours = 1)
        {
            return new PasswordResetTokenDomain(
                userId,
                tokenHash,
                DateTime.UtcNow.AddHours(hours),
                ipAddress);
        }


        // === Reconstitution ===

        public static PasswordResetTokenDomain Reconstitute(
            Guid id,
            Guid userId,
            string tokenHash,
            DateTime expiresAt,
            bool isUsed,
            DateTime? usedAt,
            string? ipAddress,
            DateTime createdAt)
        {
            return new PasswordResetTokenDomain
            {
                Id = id,
                UserId = userId,
                TokenHash = tokenHash,
                ExpiresAt = expiresAt,
                IsUsed = isUsed,
                UsedAt = usedAt,
                IpAddress = ipAddress,
                CreatedAt = createdAt
            };
        }


        // === Behavior Methods ===

        public bool IsExpired()
        {
            return DateTime.UtcNow >= ExpiresAt;
        }

        public bool IsValid()
        {
            return !IsUsed && !IsExpired();
        }

        public void MarkAsUsed()
        {
            EnsureValid();

            IsUsed = true;

            UsedAt = DateTime.UtcNow;
        }

        public void EnsureValid()
        {
            if (IsUsed)
            {
                throw new DomainException(
                    "Token đặt lại mật khẩu đã được sử dụng.");
            }

            if (IsExpired())
            {
                throw new DomainException(
                    "Token đặt lại mật khẩu đã hết hạn.");
            }
        }
    }
}