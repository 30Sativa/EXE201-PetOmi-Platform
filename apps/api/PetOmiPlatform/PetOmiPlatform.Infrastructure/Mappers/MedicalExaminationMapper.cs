using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;

namespace PetOmiPlatform.Infrastructure.Mappers
{
    public static class MedicalExaminationMapper
    {
        public static MedicalExaminationDomain ToDomain(this MedicalExamination entity) =>
            MedicalExaminationDomain.Reconstitute(
                id: entity.ExaminationId,
                appointmentId: entity.AppointmentId,
                petId: entity.PetId,
                vetClinicId: entity.VetClinicId,
                chiefComplaint: entity.ChiefComplaint,
                weightKg: entity.WeightKg,
                temperatureC: entity.TemperatureC,
                heartRate: entity.HeartRate,
                respiratoryRate: entity.RespiratoryRate,
                examinationNotes: entity.ExaminationNotes,
                diagnosis: entity.Diagnosis,
                treatmentPlan: entity.TreatmentPlan,
                status: Enum.Parse<ExaminationStatus>(entity.Status),
                createdAt: entity.CreatedAt,
                updatedAt: entity.UpdatedAt,
                completedAt: entity.CompletedAt
            );

        public static MedicalExamination ToEntity(this MedicalExaminationDomain domain) =>
            new MedicalExamination
            {
                ExaminationId = domain.Id,
                AppointmentId = domain.AppointmentId,
                PetId = domain.PetId,
                VetClinicId = domain.VetClinicId,
                ChiefComplaint = domain.ChiefComplaint,
                WeightKg = domain.WeightKg,
                TemperatureC = domain.TemperatureC,
                HeartRate = domain.HeartRate,
                RespiratoryRate = domain.RespiratoryRate,
                ExaminationNotes = domain.ExaminationNotes,
                Diagnosis = domain.Diagnosis,
                TreatmentPlan = domain.TreatmentPlan,
                Status = domain.Status.ToString(),
                CreatedAt = domain.CreatedAt,
                UpdatedAt = domain.UpdatedAt,
                CompletedAt = domain.CompletedAt
            };
    }
}
