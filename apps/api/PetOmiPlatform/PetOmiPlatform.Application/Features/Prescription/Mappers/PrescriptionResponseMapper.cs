using PetOmiPlatform.Application.Features.Prescription.DTOs.Response;
using PetOmiPlatform.Domain.Entities;

namespace PetOmiPlatform.Application.Features.Prescription.Mappers
{
    public static class PrescriptionResponseMapper
    {
        public static PrescriptionItemResponse ToResponse(this PrescriptionDomain prescription)
        {
            return new PrescriptionItemResponse
            {
                Id = prescription.Id,
                ExaminationId = prescription.ExaminationId,
                MedicationName = prescription.MedicationName,
                Dosage = prescription.Dosage,
                Frequency = prescription.Frequency,
                DurationDays = prescription.DurationDays,
                Instructions = prescription.Instructions,
                InventoryItemId = prescription.InventoryItemId,
                CreatedAt = prescription.CreatedAt
            };
        }
    }
}
