using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Features.MedicalExamination.Command;
using PetOmiPlatform.Application.Features.MedicalExamination.DTOs.Response;
using PetOmiPlatform.Application.Features.MedicalExamination.Mappers;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Application.Interfaces;

namespace PetOmiPlatform.Application.Features.MedicalExamination.Handler
{
    public class UpdateExaminationCommandHandler : IRequestHandler<UpdateExaminationCommand, ExaminationResponse>
    {
        private readonly IMedicalExaminationRepository _examinationRepository;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IUnitOfWork _unitOfWork;

        public UpdateExaminationCommandHandler(
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

        public async Task<ExaminationResponse> Handle(UpdateExaminationCommand request, CancellationToken cancellationToken)
        {
            var exam = await _examinationRepository.GetByIdAsync(request.ExaminationId);
            if (exam == null)
                throw new NotFoundException($"Không tìm thấy phiếu khám ID {request.ExaminationId}");

            var appointment = await _appointmentRepository.GetByIdAsync(exam.AppointmentId);
            if (appointment == null || appointment.ClinicId != request.ClinicId)
                throw new ForbiddenException("Không có quyền cập nhật phiếu khám này.");

            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(request.VetUserId, request.ClinicId);
            ClinicRoleGuard.RequireMedicalWriter(staff);

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

            return exam.ToResponse();
        }
    }
}
