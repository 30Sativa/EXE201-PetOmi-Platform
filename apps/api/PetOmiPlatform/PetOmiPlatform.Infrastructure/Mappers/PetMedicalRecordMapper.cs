using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;

namespace PetOmiPlatform.Infrastructure.Mappers
{
    public static class PetMedicalRecordMapper
    {
        public static PetMedicalRecordDomain ToDomain(this PetMedicalRecord entity)
        {
            return PetMedicalRecordDomain.Reconstitute(
                id: entity.MedicalRecordId,
                petId: entity.PetId,
                recordType: entity.RecordType,
                title: entity.Title,
                description: entity.Description,
                recordDate: entity.RecordDate,
                vetName: entity.VetName,
                clinicName: entity.ClinicName,
                medicationName: entity.MedicationName,
                dosage: entity.Dosage,
                startDate: entity.StartDate,
                endDate: entity.EndDate,
                attachmentUrl: entity.AttachmentUrl,
                createdAt: entity.CreatedAt,
                updatedAt: entity.UpdatedAt,
                deletedAt: entity.DeletedAt,
                isActive: entity.IsActive
            );
        }

        public static PetMedicalRecord ToEntity(this PetMedicalRecordDomain domain)
        {
            return new PetMedicalRecord
            {
                MedicalRecordId = domain.Id,
                PetId = domain.PetId,
                RecordType = domain.RecordType,
                Title = domain.Title,
                Description = domain.Description,
                RecordDate = domain.RecordDate,
                VetName = domain.VetName,
                ClinicName = domain.ClinicName,
                MedicationName = domain.MedicationName,
                Dosage = domain.Dosage,
                StartDate = domain.StartDate,
                EndDate = domain.EndDate,
                AttachmentUrl = domain.AttachmentUrl,
                CreatedAt = domain.CreatedAt,
                UpdatedAt = domain.UpdatedAt,
                DeletedAt = domain.DeletedAt,
                IsActive = domain.IsActive
            };
        }
    }
}
