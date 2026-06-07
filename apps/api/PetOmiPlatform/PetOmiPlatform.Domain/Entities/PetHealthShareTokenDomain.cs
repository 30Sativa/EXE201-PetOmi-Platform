using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Exceptions;

namespace PetOmiPlatform.Domain.Entities
{
    public class PetHealthShareTokenDomain : BaseEntity
    {
        public Guid PetId { get; private set; }
        public Guid OwnerUserId { get; private set; }
        public Guid? ClinicId { get; private set; }
        public string DisplayCode { get; private set; }
        public string TokenHash { get; private set; }
        public PetHealthShareScope Scope { get; private set; }
        public PetHealthShareAccessMode AccessMode { get; private set; }
        public DateTime ExpiresAt { get; private set; }
        public int? MaxUses { get; private set; }
        public int UsedCount { get; private set; }
        public DateTime? LastUsedAt { get; private set; }
        public DateTime? RevokedAt { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public Guid CreatedByUserId { get; private set; }
        public string? Note { get; private set; }

        private PetHealthShareTokenDomain() { }

        private PetHealthShareTokenDomain(
            Guid petId,
            Guid ownerUserId,
            Guid? clinicId,
            string displayCode,
            string tokenHash,
            PetHealthShareScope scope,
            PetHealthShareAccessMode accessMode,
            DateTime expiresAt,
            int? maxUses,
            Guid createdByUserId,
            string? note)
        {
            Id = Guid.NewGuid();
            PetId = petId;
            OwnerUserId = ownerUserId;
            ClinicId = clinicId;
            DisplayCode = NormalizeCode(displayCode);
            TokenHash = tokenHash;
            Scope = scope;
            AccessMode = accessMode;
            ExpiresAt = expiresAt;
            MaxUses = maxUses;
            CreatedByUserId = createdByUserId;
            Note = note;
            UsedCount = 0;
            CreatedAt = DateTime.UtcNow;
        }

        public static PetHealthShareTokenDomain Create(
            Guid petId,
            Guid ownerUserId,
            Guid? clinicId,
            string displayCode,
            string tokenHash,
            PetHealthShareScope scope,
            PetHealthShareAccessMode accessMode,
            DateTime expiresAt,
            int? maxUses,
            Guid createdByUserId,
            string? note)
        {
            ValidateExpiry(expiresAt);
            ValidateMaxUses(accessMode, maxUses);

            if (string.IsNullOrWhiteSpace(tokenHash))
                throw new DomainException("TokenHash khong hop le.");

            return new PetHealthShareTokenDomain(
                petId,
                ownerUserId,
                clinicId,
                displayCode,
                tokenHash,
                scope,
                accessMode,
                expiresAt,
                maxUses,
                createdByUserId,
                note);
        }

        public static PetHealthShareTokenDomain Reconstitute(
            Guid id,
            Guid petId,
            Guid ownerUserId,
            Guid? clinicId,
            string displayCode,
            string tokenHash,
            PetHealthShareScope scope,
            PetHealthShareAccessMode accessMode,
            DateTime expiresAt,
            int? maxUses,
            int usedCount,
            DateTime? lastUsedAt,
            DateTime? revokedAt,
            DateTime createdAt,
            Guid createdByUserId,
            string? note)
        {
            return new PetHealthShareTokenDomain
            {
                Id = id,
                PetId = petId,
                OwnerUserId = ownerUserId,
                ClinicId = clinicId,
                DisplayCode = displayCode,
                TokenHash = tokenHash,
                Scope = scope,
                AccessMode = accessMode,
                ExpiresAt = expiresAt,
                MaxUses = maxUses,
                UsedCount = usedCount,
                LastUsedAt = lastUsedAt,
                RevokedAt = revokedAt,
                CreatedAt = createdAt,
                CreatedByUserId = createdByUserId,
                Note = note
            };
        }

        public bool IsExpired(DateTime nowUtc) => ExpiresAt <= nowUtc;

        public bool IsRevoked() => RevokedAt.HasValue;

        public bool HasReachedMaxUses()
        {
            if (AccessMode == PetHealthShareAccessMode.OneTime)
                return UsedCount >= 1;

            return MaxUses.HasValue && UsedCount >= MaxUses.Value;
        }

        public bool CanBeUsedByClinic(Guid? clinicId, DateTime nowUtc)
        {
            if (IsRevoked() || IsExpired(nowUtc) || HasReachedMaxUses())
                return false;

            return ClinicId == null || ClinicId == clinicId;
        }

        public void RegisterSuccessfulUse(DateTime nowUtc)
        {
            if (IsRevoked())
                throw new DomainException("Ma chia se ho so suc khoe da bi thu hoi.");

            if (IsExpired(nowUtc))
                throw new DomainException("Ma chia se ho so suc khoe da het han.");

            if (HasReachedMaxUses())
                throw new DomainException("Ma chia se ho so suc khoe da dat gioi han su dung.");

            UsedCount += 1;
            LastUsedAt = nowUtc;
        }

        public void Revoke(DateTime nowUtc)
        {
            if (IsRevoked())
                throw new DomainException("Ma chia se ho so suc khoe da bi thu hoi truoc do.");

            RevokedAt = nowUtc;
        }

        private static string NormalizeCode(string displayCode)
        {
            if (string.IsNullOrWhiteSpace(displayCode))
                throw new DomainException("Ma chia se ho so suc khoe khong hop le.");

            return displayCode.Trim().ToUpperInvariant();
        }

        private static void ValidateExpiry(DateTime expiresAt)
        {
            if (expiresAt <= DateTime.UtcNow)
                throw new DomainException("Thoi gian het han phai o tuong lai.");
        }

        private static void ValidateMaxUses(PetHealthShareAccessMode accessMode, int? maxUses)
        {
            if (maxUses.HasValue && maxUses.Value <= 0)
                throw new DomainException("Gioi han so lan su dung phai lon hon 0.");

            if (accessMode == PetHealthShareAccessMode.OneTime && maxUses.HasValue && maxUses.Value != 1)
                throw new DomainException("Ma su dung mot lan chi duoc co MaxUses bang 1.");
        }
    }
}
