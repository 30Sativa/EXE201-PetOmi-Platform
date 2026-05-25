using PetOmiPlatform.Application.Features.MedicalExamination.DTOs.Response;
using PetOmiPlatform.Domain.Entities;

namespace PetOmiPlatform.Application.Features.MedicalExamination.Mappers
{
    public static class ExaminationResponseMapper
    {
        public static ExaminationResponse ToResponse(this MedicalExaminationDomain exam)
        {
            return new ExaminationResponse
            {
                Id = exam.Id,
                AppointmentId = exam.AppointmentId,
                PetId = exam.PetId,
                VetClinicId = exam.VetClinicId,
                ChiefComplaint = exam.ChiefComplaint,
                WeightKg = exam.WeightKg,
                TemperatureC = exam.TemperatureC,
                HeartRate = exam.HeartRate,
                RespiratoryRate = exam.RespiratoryRate,
                ExaminationNotes = exam.ExaminationNotes,
                Diagnosis = exam.Diagnosis,
                TreatmentPlan = exam.TreatmentPlan,
                Status = exam.Status.ToString(),
                CreatedAt = exam.CreatedAt,
                CompletedAt = exam.CompletedAt
            };
        }
    }
}
