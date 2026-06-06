using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;

namespace PetOmiPlatform.Infrastructure.Mappers
{
    public static class PetHealthShareAccessLogMapper
    {
        public static PetHealthShareAccessLogDomain ToDomain(this PetHealthShareAccessLog entity)
        {
            return PetHealthShareAccessLogDomain.Reconstitute(
                id: entity.AccessLogId,
                shareTokenId: entity.ShareTokenId,
                petId: entity.PetId,
                clinicId: entity.ClinicId,
                accessedByUserId: entity.AccessedByUserId,
                accessType: entity.AccessType,
                result: Enum.Parse<PetHealthShareAccessResult>(entity.Result),
                failureReason: entity.FailureReason,
                ipAddress: entity.IpAddress,
                userAgent: entity.UserAgent,
                createdAt: entity.CreatedAt);
        }

        public static PetHealthShareAccessLog ToEntity(this PetHealthShareAccessLogDomain domain)
        {
            return new PetHealthShareAccessLog
            {
                AccessLogId = domain.Id,
                ShareTokenId = domain.ShareTokenId,
                PetId = domain.PetId,
                ClinicId = domain.ClinicId,
                AccessedByUserId = domain.AccessedByUserId,
                AccessType = domain.AccessType,
                Result = domain.Result.ToString(),
                FailureReason = domain.FailureReason,
                IpAddress = domain.IpAddress,
                UserAgent = domain.UserAgent,
                CreatedAt = domain.CreatedAt
            };
        }
    }
}
