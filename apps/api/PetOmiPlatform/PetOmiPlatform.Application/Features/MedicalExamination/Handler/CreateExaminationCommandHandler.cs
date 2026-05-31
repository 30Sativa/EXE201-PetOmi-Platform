using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Features.MedicalExamination.Command;
using PetOmiPlatform.Application.Features.MedicalExamination.DTOs.Response;
using PetOmiPlatform.Application.Features.MedicalExamination.Mappers;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.MedicalExamination.Handler
{
    public class CreateExaminationCommandHandler : IRequestHandler<CreateExaminationCommand, ExaminationResponse>
    {
        private readonly IMedicalExaminationRepository _examinationRepository;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CreateExaminationCommandHandler(
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

        public async Task<ExaminationResponse> Handle(CreateExaminationCommand request, CancellationToken cancellationToken)
        {
            var appointment = await _appointmentRepository.GetByIdAsync(request.Payload.AppointmentId);
            if (appointment == null)
                throw new NotFoundException($"Không tìm thấy lịch hẹn ID {request.Payload.AppointmentId}");

            if (appointment.ClinicId != request.ClinicId)
                throw new ForbiddenException("Không có quyền tạo phiếu khám cho lịch hẹn này.");

            if (appointment.Status != AppointmentStatus.CheckedIn)
                throw new ConflictException("Chi co the tao phieu kham cho lich hen da check-in.");

            var existingExam = await _examinationRepository.GetByAppointmentIdAsync(request.Payload.AppointmentId);
            if (existingExam != null)
                throw new ConflictException("Lịch hẹn này đã có phiếu khám rồi.");

            // Lấy vetClinicId của bác sĩ
            var vetClinic = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(request.VetUserId, request.ClinicId);
            vetClinic = ClinicRoleGuard.RequireMedicalWriter(vetClinic);

            var exam = MedicalExaminationDomain.Create(
                appointmentId: appointment.Id,
                petId: appointment.PetId,
                chiefComplaint: request.Payload.ChiefComplaint,
                vetClinicId: vetClinic.Id,
                weightKg: request.Payload.WeightKg,
                temperatureC: request.Payload.TemperatureC,
                heartRate: request.Payload.HeartRate,
                respiratoryRate: request.Payload.RespiratoryRate,
                examinationNotes: request.Payload.ExaminationNotes,
                diagnosis: request.Payload.Diagnosis,
                treatmentPlan: request.Payload.TreatmentPlan
            );

            await _examinationRepository.AddAsync(exam);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return exam.ToResponse();
        }
    }
}
