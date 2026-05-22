using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.MedicalExamination.Command;
using PetOmiPlatform.Application.Features.MedicalExamination.DTOs.Response;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Application.Interfaces;

namespace PetOmiPlatform.Application.Features.MedicalExamination.Handler
{
    public class UpdateExaminationCommandHandler : IRequestHandler<UpdateExaminationCommand, ExaminationResponse>
    {
        private readonly IMedicalExaminationRepository _examinationRepository;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IUnitOfWork _unitOfWork;

        public UpdateExaminationCommandHandler(
            IMedicalExaminationRepository examinationRepository,
            IAppointmentRepository appointmentRepository,
            IUnitOfWork unitOfWork)
        {
            _examinationRepository = examinationRepository;
            _appointmentRepository = appointmentRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ExaminationResponse> Handle(UpdateExaminationCommand request, CancellationToken cancellationToken)
        {
            var exam = await _examinationRepository.GetByIdAsync(request.ExaminationId);
            if (exam == null)
                throw new NotFoundException($"Không tìm thấy phiếu khám ID {request.ExaminationId}");

            var appointment = await _appointmentRepository.GetByIdAsync(exam.AppointmentId);
            if (appointment == null || appointment.ClinicId != request.ClinicId)
                throw new ForbiddenException("Không có quyền cập nhật phiếu khám này.");

            exam.Update(
                chiefComplaint: request.Payload.ChiefComplaint,
                weightKg: request.Payload.WeightKg,
                temperatureC: request.Payload.TemperatureC,
                heartRate: request.Payload.HeartRate,
                respiratoryRate: request.Payload.RespiratoryRate,
                examinationNotes: request.Payload.ExaminationNotes,
                diagnosis: request.Payload.Diagnosis,
                treatmentPlan: request.Payload.TreatmentPlan
            );

            await _examinationRepository.UpdateAsync(exam);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

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
