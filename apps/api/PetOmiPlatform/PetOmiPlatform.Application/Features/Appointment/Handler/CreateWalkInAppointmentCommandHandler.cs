using MediatR;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Appointment.Command;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Response;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Appointment.Handler
{
    public class CreateWalkInAppointmentCommandHandler
        : IRequestHandler<CreateWalkInAppointmentCommand, AppointmentResponse>
    {
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IClinicRepository _clinicRepository;
        private readonly IClinicServiceRepository _serviceRepository;
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IPetRepository _petRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CreateWalkInAppointmentCommandHandler(
            IAppointmentRepository appointmentRepository,
            IClinicRepository clinicRepository,
            IClinicServiceRepository serviceRepository,
            IVetClinicRepository vetClinicRepository,
            IPetRepository petRepository,
            IUnitOfWork unitOfWork)
        {
            _appointmentRepository = appointmentRepository;
            _clinicRepository = clinicRepository;
            _serviceRepository = serviceRepository;
            _vetClinicRepository = vetClinicRepository;
            _petRepository = petRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<AppointmentResponse> Handle(
            CreateWalkInAppointmentCommand command, CancellationToken cancellationToken)
        {
            var req = command.Request;

            var clinic = await _clinicRepository.GetByIdAsync(req.ClinicId)
                ?? throw new NotFoundException("Clinic", req.ClinicId);
            clinic.EnsureApproved();

            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(command.StaffUserId, req.ClinicId);
            ClinicRoleGuard.RequireActiveStaff(staff);

            var pet = await _petRepository.GetByIdAsync(req.PetId)
                ?? throw new NotFoundException("Pet", req.PetId);
            pet.EnsureActive();

            if (req.ServiceId.HasValue)
            {
                var service = await _serviceRepository.GetByIdAsync(req.ServiceId.Value)
                    ?? throw new NotFoundException("ClinicService", req.ServiceId.Value);
                if (service.ClinicId != req.ClinicId || !service.IsActive)
                    throw new ValidationException("ServiceId", "Dich vu khong thuoc clinic hoac da ngung hoat dong.");
            }

            if (!Enum.TryParse<AppointmentType>(req.AppointmentType, true, out var apptType))
                throw new ValidationException("AppointmentType", $"Loại lịch hẹn không hợp lệ: {req.AppointmentType}");

            if (req.VetClinicId.HasValue)
            {
                var vetClinic = await _vetClinicRepository.GetActiveByVetClinicIdAndClinicIdAsync(
                    req.VetClinicId.Value,
                    req.ClinicId)
                    ?? throw new ValidationException("VetClinicId", "Bac si khong thuoc clinic hoac da ngung hoat dong.");

                var allVetClinicIds = await _vetClinicRepository.GetAllVetClinicIdsAsync(vetClinic.VetProfileId);
                var hasConflict = await _appointmentRepository.HasDoctorConflictAcrossClinicsAsync(
                    allVetClinicIds, req.AppointmentDate, req.StartTime, req.EndTime);

                if (hasConflict)
                    throw new ConflictException("Bác sĩ đã có lịch trong khung giờ này.");
            }

            var appointment = AppointmentDomain.CreateWalkIn(
                clinicId: req.ClinicId,
                petId: req.PetId,
                staffUserId: command.StaffUserId,
                appointmentDate: req.AppointmentDate,
                startTime: req.StartTime,
                endTime: req.EndTime,
                appointmentType: apptType,
                vetClinicId: req.VetClinicId,
                serviceId: req.ServiceId,
                notes: req.Notes);

            await _appointmentRepository.AddAsync(appointment);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new AppointmentResponse
            {
                AppointmentId = appointment.Id,
                ClinicId = appointment.ClinicId,
                VetClinicId = appointment.VetClinicId,
                ServiceId = appointment.ServiceId,
                PetId = appointment.PetId,
                BookedByUserId = appointment.BookedByUserId,
                AppointmentDate = appointment.AppointmentDate,
                StartTime = appointment.StartTime,
                EndTime = appointment.EndTime,
                AppointmentType = appointment.AppointmentType.ToString(),
                Status = appointment.Status.ToString(),
                Notes = appointment.Notes,
                CancellationReason = appointment.CancellationReason,
                IsWalkIn = appointment.IsWalkIn,
                IsLateCancellation = appointment.IsLateCancellation,
                ConfirmedAt = appointment.ConfirmedAt,
                CancelledAt = appointment.CancelledAt,
                CreatedAt = appointment.CreatedAt
            };
        }
    }
}
