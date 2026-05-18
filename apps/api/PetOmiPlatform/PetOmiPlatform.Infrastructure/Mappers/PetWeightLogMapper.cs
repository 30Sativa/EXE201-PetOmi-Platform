using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;

namespace PetOmiPlatform.Infrastructure.Mappers
{
    public static class PetWeightLogMapper
    {
        public static PetWeightLogDomain ToDomain(this PetWeightLog entity)
        {
            return PetWeightLogDomain.Reconstitute(
                id: entity.WeightLogId,
                petId: entity.PetId,
                weightKg: entity.WeightKg,
                measuredAt: entity.MeasuredAt,
                source: entity.Source,
                note: entity.Note,
                createdAt: entity.CreatedAt
            );
        }

        public static PetWeightLog ToEntity(this PetWeightLogDomain domain)
        {
            return new PetWeightLog
            {
                WeightLogId = domain.Id,
                PetId = domain.PetId,
                WeightKg = domain.WeightKg,
                MeasuredAt = domain.MeasuredAt,
                Source = domain.Source,
                Note = domain.Note,
                CreatedAt = domain.CreatedAt
            };
        }
    }
}
