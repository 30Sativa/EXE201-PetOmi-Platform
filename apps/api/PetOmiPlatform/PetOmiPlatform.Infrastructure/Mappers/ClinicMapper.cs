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
                licenseImageUrl: entity.LicenseImageUrl,
                logoUrl: entity.LogoUrl,
                description: entity.Description,
                openingHours: entity.OpeningHours,
                status: entity.Status,
                rejectedReason: entity.RejectedReason,
                reviewedByAdminId: entity.ReviewedByAdminId,
                createdAt: entity.CreatedAt,
                updatedAt: entity.UpdatedAt,
                latitude: entity.Latitude,
                longitude: entity.Longitude,
                appointmentBufferMins: entity.AppointmentBufferMins
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
                LicenseImageUrl = domain.LicenseImageUrl,
                LogoUrl = domain.LogoUrl,
                Description = domain.Description,
                OpeningHours = domain.OpeningHours,
                Latitude = domain.Latitude,
                Longitude = domain.Longitude,
                AppointmentBufferMins = domain.AppointmentBufferMins,
                Status = domain.Status.ToString(),
                RejectedReason = domain.RejectedReason,
                ReviewedByAdminId = domain.ReviewedByAdminId,
                CreatedAt = domain.CreatedAt,
                UpdatedAt = domain.UpdatedAt
            };
        }
    }
}
