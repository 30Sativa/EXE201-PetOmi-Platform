using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.MedicalExamination.Command;
using PetOmiPlatform.Application.Features.MedicalExamination.DTOs.Response;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Application.Interfaces;

namespace PetOmiPlatform.Application.Features.MedicalExamination.Handler
{
    public class CompleteExaminationCommandHandler : IRequestHandler<CompleteExaminationCommand, ExaminationResponse>
    {
        private readonly IMedicalExaminationRepository _examinationRepository;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CompleteExaminationCommandHandler(
            IMedicalExaminationRepository examinationRepository,
            IAppointmentRepository appointmentRepository,
            IUnitOfWork unitOfWork)
        {
            _examinationRepository = examinationRepository;
            _appointmentRepository = appointmentRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ExaminationResponse> Handle(CompleteExaminationCommand request, CancellationToken cancellationToken)
        {
            var exam = await _examinationRepository.GetByIdAsync(request.ExaminationId);
            if (exam == null)
                throw new NotFoundException($"Không tìm thấy phiếu khám ID {request.ExaminationId}");

            var appointment = await _appointmentRepository.GetByIdAsync(exam.AppointmentId);
            if (appointment == null || appointment.ClinicId != request.ClinicId)
                throw new ForbiddenException("Không có quyền truy cập phiếu khám này.");

            // 1. Complete phiếu khám
            exam.Complete();
            await _examinationRepository.UpdateAsync(exam);

            // 2. Tự động Complete lịch hẹn theo đề xuất plan
            // Cần truyền user ID nào? Ở đây là VetUserId (bác sĩ đang đăng nhập)
            // Lưu ý AppointmentDomain chưa có logic Complete. Sẽ gọi Complete cho Appointment.
            appointment.Complete(request.VetUserId);
            await _appointmentRepository.UpdateAsync(appointment);

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
