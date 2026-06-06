using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Exceptions;

namespace PetOmiPlatform.Domain.Entities
{
    public class PetHealthShareAccessLogDomain : BaseEntity
    {
        public Guid? ShareTokenId { get; private set; }
        public Guid PetId { get; private set; }
        public Guid? ClinicId { get; private set; }
        public Guid? AccessedByUserId { get; private set; }
        public string AccessType { get; private set; }
        public PetHealthShareAccessResult Result { get; private set; }
        public string? FailureReason { get; private set; }
        public string? IpAddress { get; private set; }
        public string? UserAgent { get; private set; }
        public DateTime CreatedAt { get; private set; }

        private PetHealthShareAccessLogDomain() { }

        private PetHealthShareAccessLogDomain(
            Guid? shareTokenId,
            Guid petId,
            Guid? clinicId,
            Guid? accessedByUserId,
            string accessType,
            PetHealthShareAccessResult result,
            string? failureReason,
            string? ipAddress,
            string? userAgent)
        {
            Id = Guid.NewGuid();
            ShareTokenId = shareTokenId;
            PetId = petId;
            ClinicId = clinicId;
            AccessedByUserId = accessedByUserId;
            AccessType = NormalizeAccessType(accessType);
            Result = result;
            FailureReason = failureReason;
            IpAddress = ipAddress;
            UserAgent = userAgent;
            CreatedAt = DateTime.UtcNow;
        }

        public static PetHealthShareAccessLogDomain Create(
            Guid? shareTokenId,
            Guid petId,
            Guid? clinicId,
            Guid? accessedByUserId,
            string accessType,
            PetHealthShareAccessResult result,
            string? failureReason,
            string? ipAddress,
            string? userAgent)
        {
            return new PetHealthShareAccessLogDomain(
                shareTokenId,
                petId,
                clinicId,
                accessedByUserId,
                accessType,
                result,
                failureReason,
                ipAddress,
                userAgent);
        }

        public static PetHealthShareAccessLogDomain Reconstitute(
            Guid id,
            Guid? shareTokenId,
            Guid petId,
            Guid? clinicId,
            Guid? accessedByUserId,
            string accessType,
            PetHealthShareAccessResult result,
            string? failureReason,
            string? ipAddress,
            string? userAgent,
            DateTime createdAt)
        {
            return new PetHealthShareAccessLogDomain
            {
                Id = id,
                ShareTokenId = shareTokenId,
                PetId = petId,
                ClinicId = clinicId,
                AccessedByUserId = accessedByUserId,
                AccessType = accessType,
                Result = result,
                FailureReason = failureReason,
                IpAddress = ipAddress,
                UserAgent = userAgent,
                CreatedAt = createdAt
            };
        }

        private static string NormalizeAccessType(string accessType)
        {
            if (string.IsNullOrWhiteSpace(accessType))
                throw new DomainException("AccessType khong hop le.");

            return accessType.Trim();
        }
    }
}
