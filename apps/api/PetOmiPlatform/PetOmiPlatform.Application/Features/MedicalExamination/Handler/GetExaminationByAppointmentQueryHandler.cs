using MediatR;
using PetOmiPlatform.Application.Features.MedicalExamination.DTOs.Response;
using PetOmiPlatform.Application.Features.MedicalExamination.Query;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.MedicalExamination.Handler
{
    public class GetExaminationByAppointmentQueryHandler : IRequestHandler<GetExaminationByAppointmentQuery, ExaminationResponse?>
    {
        private readonly IMedicalExaminationRepository _examinationRepository;

        public GetExaminationByAppointmentQueryHandler(IMedicalExaminationRepository examinationRepository)
        {
            _examinationRepository = examinationRepository;
        }

        public async Task<ExaminationResponse?> Handle(GetExaminationByAppointmentQuery request, CancellationToken cancellationToken)
        {
            var exam = await _examinationRepository.GetByAppointmentIdAsync(request.AppointmentId);
            if (exam == null) return null;

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
