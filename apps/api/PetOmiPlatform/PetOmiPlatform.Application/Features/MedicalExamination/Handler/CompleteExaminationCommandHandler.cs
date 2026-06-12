using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Features.MedicalExamination.Command;
using PetOmiPlatform.Application.Features.MedicalExamination.DTOs.Response;
using PetOmiPlatform.Application.Features.MedicalExamination.Mappers;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Application.Interfaces;

namespace PetOmiPlatform.Application.Features.MedicalExamination.Handler
{
    public class CompleteExaminationCommandHandler : IRequestHandler<CompleteExaminationCommand, ExaminationResponse>
    {
        private readonly IMedicalExaminationRepository _examinationRepository;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CompleteExaminationCommandHandler(
            IMedicalExaminationRepository examinationRepository,
            IAppointmentRepository appointmentRepository,
            IVetClinicRepository vetClinicRepository,
            IUnitOfWork unitOfWork)
        {
            _examinationRepository = examinationRepository;
            _appointmentRepository = appointmentRepository;
            _vetClinicRepository = vetClinicRepository;
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

            if (appointment.Status != AppointmentStatus.CheckedIn)
                throw new ConflictException("Chỉ có thể hoàn tất phiếu khám cho lịch hẹn đã check-in.");

            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(request.VetUserId, request.ClinicId);
            ClinicRoleGuard.RequireMedicalWriter(staff);

            // 1. Complete phiếu khám
            exam.Complete();
            await _examinationRepository.UpdateAsync(exam);

            // 2. Tự động Complete lịch hẹn theo đề xuất plan
            // Cần truyền user ID nào? Ở đây là VetUserId (bác sĩ đang đăng nhập)
            // Lưu ý AppointmentDomain chưa có logic Complete. Sẽ gọi Complete cho Appointment.
            appointment.Complete(request.VetUserId);
            await _appointmentRepository.UpdateAsync(appointment);

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return exam.ToResponse();
        }
    }
}
