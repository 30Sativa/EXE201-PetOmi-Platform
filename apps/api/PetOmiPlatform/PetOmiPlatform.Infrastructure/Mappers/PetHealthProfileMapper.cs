using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;

namespace PetOmiPlatform.Infrastructure.Mappers
{
    public static class PetHealthProfileMapper
    {
        public static PetHealthProfileDomain ToDomain(this PetHealthProfile entity)
        {
            return PetHealthProfileDomain.Reconstitute(
                id: entity.PetHealthProfileId,
                petId: entity.PetId,
                currentWeightKg: entity.CurrentWeightKg,
                color: entity.Color,
                isNeutered: entity.IsNeutered,
                allergies: entity.Allergies,
                chronicConditions: entity.ChronicConditions,
                microchipNumber: entity.MicrochipNumber,
                createdAt: entity.CreatedAt,
                updatedAt: entity.UpdatedAt
            );
        }

        public static PetHealthProfile ToEntity(this PetHealthProfileDomain domain)
        {
            return new PetHealthProfile
            {
                PetHealthProfileId = domain.Id,
                PetId = domain.PetId,
                CurrentWeightKg = domain.CurrentWeightKg,
                Color = domain.Color,
                IsNeutered = domain.IsNeutered,
                Allergies = domain.Allergies,
                ChronicConditions = domain.ChronicConditions,
                MicrochipNumber = domain.MicrochipNumber,
                CreatedAt = domain.CreatedAt,
                UpdatedAt = domain.UpdatedAt
            };
        }
    }
}
