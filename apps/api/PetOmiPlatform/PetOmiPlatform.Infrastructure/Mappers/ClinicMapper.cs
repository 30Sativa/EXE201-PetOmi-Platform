using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;

namespace PetOmiPlatform.Infrastructure.Mappers
{
    public static class ClinicMapper
    {
        public static ClinicDomain ToDomain(this Clinic entity)
        {
            return ClinicDomain.Reconstitute(
                id: entity.ClinicId,
                clinicName: entity.ClinicName,
                address: entity.Address,
                phone: entity.Phone,
                email: entity.Email,
                licenseNumber: entity.LicenseNumber,
                status: entity.Status,
                rejectedReason: entity.RejectedReason,
                reviewedByAdminId: entity.ReviewedByAdminId,
                createdAt: entity.CreatedAt,
                updatedAt: entity.UpdatedAt
            );
        }

        public static Clinic ToEntity(this ClinicDomain domain)
        {
            return new Clinic
            {
                ClinicId = domain.Id,
                ClinicName = domain.ClinicName,
                Address = domain.Address,
                Phone = domain.Phone,
                Email = domain.Email,
                LicenseNumber = domain.LicenseNumber,
                Status = domain.Status.ToString(),
                RejectedReason = domain.RejectedReason,
                ReviewedByAdminId = domain.ReviewedByAdminId,
                CreatedAt = domain.CreatedAt,
                UpdatedAt = domain.UpdatedAt
            };
        }
    }
}
