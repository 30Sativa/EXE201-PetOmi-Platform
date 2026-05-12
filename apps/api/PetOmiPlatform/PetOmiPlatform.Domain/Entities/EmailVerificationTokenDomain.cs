using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Exceptions;

namespace PetOmiPlatform.Domain.Entities
{
    public class EmailVerificationTokenDomain : BaseEntity
    {
        public Guid UserId { get; private set; }

        public string TokenHash { get; private set; } = string.Empty;

        public DateTime ExpiresAt { get; private set; }

        public bool IsUsed { get; private set; }

        public DateTime CreatedAt { get; private set; }

        public DateTime? UsedAt { get; private set; }


        // === Constructors ===

        // For EF Core
        private EmailVerificationTokenDomain() { }

        private EmailVerificationTokenDomain(
            Guid userId,
            string tokenHash,
            DateTime expiresAt)
        {
            Id = Guid.NewGuid();

            UserId = userId;

            TokenHash = tokenHash;

            ExpiresAt = expiresAt;

            IsUsed = false;

            CreatedAt = DateTime.UtcNow;
        }


        // === Factory Method ===

        public static EmailVerificationTokenDomain Create(
            Guid userId,
            string tokenHash,
            int hours = 24)
        {
            return new EmailVerificationTokenDomain(
                userId,
                tokenHash,
                DateTime.UtcNow.AddHours(hours));
        }


        // === Reconstitution ===

        public static EmailVerificationTokenDomain Reconstitute(
            Guid id,
            Guid userId,
            string tokenHash,
            DateTime expiresAt,
            bool isUsed,
            DateTime createdAt,
            DateTime? usedAt)
        {
            return new EmailVerificationTokenDomain
            {
                Id = id,
                UserId = userId,
                TokenHash = tokenHash,
                ExpiresAt = expiresAt,
                IsUsed = isUsed,
                CreatedAt = createdAt,
                UsedAt = usedAt
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
                    "Token xác thực email đã được sử dụng.");
            }

            if (IsExpired())
            {
                throw new DomainException(
                    "Token xác thực email đã hết hạn.");
            }
        }
    }
}