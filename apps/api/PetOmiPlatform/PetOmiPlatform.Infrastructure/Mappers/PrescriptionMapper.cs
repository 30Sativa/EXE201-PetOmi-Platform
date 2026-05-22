using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;

namespace PetOmiPlatform.Infrastructure.Mappers
{
    public static class PrescriptionMapper
    {
        public static PrescriptionDomain ToDomain(this Prescription entity) =>
            PrescriptionDomain.Reconstitute(
                id: entity.PrescriptionId,
                examinationId: entity.ExaminationId,
                medicationName: entity.MedicationName,
                dosage: entity.Dosage,
                frequency: entity.Frequency,
                durationDays: entity.DurationDays,
                instructions: entity.Instructions,
                inventoryItemId: entity.InventoryItemId,
                createdAt: entity.CreatedAt
            );

        public static Prescription ToEntity(this PrescriptionDomain domain) =>
            new Prescription
            {
                PrescriptionId = domain.Id,
                ExaminationId = domain.ExaminationId,
                MedicationName = domain.MedicationName,
                Dosage = domain.Dosage,
                Frequency = domain.Frequency,
                DurationDays = domain.DurationDays,
                Instructions = domain.Instructions,
                InventoryItemId = domain.InventoryItemId,
                CreatedAt = domain.CreatedAt
            };
    }
}
