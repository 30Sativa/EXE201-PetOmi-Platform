using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;

namespace PetOmiPlatform.Infrastructure.Mappers
{
    public static class ClinicServiceMapper
    {
        public static ClinicServiceDomain ToDomain(this ClinicService entity)
        {
            return ClinicServiceDomain.Reconstitute(
                id: entity.ServiceId,
                clinicId: entity.ClinicId,
                serviceName: entity.ServiceName,
                description: entity.Description,
                price: entity.Price,
                durationMins: entity.DurationMins,
                isActive: entity.IsActive,
                createdAt: entity.CreatedAt,
                updatedAt: entity.UpdatedAt
            );
        }

        public static ClinicService ToEntity(this ClinicServiceDomain domain)
        {
            return new ClinicService
            {
                ServiceId = domain.Id,
                ClinicId = domain.ClinicId,
                ServiceName = domain.ServiceName,
                Description = domain.Description,
                Price = domain.Price,
                DurationMins = domain.DurationMins,
                IsActive = domain.IsActive,
                CreatedAt = domain.CreatedAt,
                UpdatedAt = domain.UpdatedAt
            };
        }
    }
}
