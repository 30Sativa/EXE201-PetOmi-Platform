using MediatR;
using Microsoft.Extensions.Logging;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Appointment.Command;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Response;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Appointment.Handler
{
    public class BookAppointmentCommandHandler
        : IRequestHandler<BookAppointmentCommand, AppointmentResponse>
    {
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IClinicRepository _clinicRepository;
        private readonly IClinicServiceRepository _serviceRepository;
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IPetRepository _petRepository;
        private readonly IPetAccessService _petAccessService;
        private readonly IReminderRepository _reminderRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IReminderAutoCreator _reminderAutoCreator;
        private readonly ILogger<BookAppointmentCommandHandler> _logger;

        public BookAppointmentCommandHandler(
            IAppointmentRepository appointmentRepository,
            IClinicRepository clinicRepository,
            IClinicServiceRepository serviceRepository,
            IVetClinicRepository vetClinicRepository,
            IPetRepository petRepository,
            IPetAccessService petAccessService,
            IReminderRepository reminderRepository,
            IUnitOfWork unitOfWork,
            IReminderAutoCreator reminderAutoCreator,
            ILogger<BookAppointmentCommandHandler> logger)
        {
            _appointmentRepository = appointmentRepository;
            _clinicRepository = clinicRepository;
            _serviceRepository = serviceRepository;
            _vetClinicRepository = vetClinicRepository;
            _petRepository = petRepository;
            _petAccessService = petAccessService;
            _reminderRepository = reminderRepository;
            _unitOfWork = unitOfWork;
            _reminderAutoCreator = reminderAutoCreator;
            _logger = logger;
        }

        public async Task<AppointmentResponse> Handle(
            BookAppointmentCommand command, CancellationToken cancellationToken)
        {
            var req = command.Request;

            if (!req.VetClinicId.HasValue)
                throw new ValidationException("VetClinicId", "Vui lòng chọn bác sĩ để đặt lịch.");

            var clinic = await _clinicRepository.GetByIdAsync(req.ClinicId)
                ?? throw new NotFoundException("Clinic", req.ClinicId);
            clinic.EnsureApproved();

            var pet = await _petRepository.GetByIdAsync(req.PetId)
                ?? throw new NotFoundException("Pet", req.PetId);
            pet.EnsureActive();
            await _petAccessService.EnsureCanWriteAsync(pet, command.OwnerUserId, cancellationToken);

            int durationMins = 30;
            if (req.ServiceId.HasValue)
            {
                var service = await _serviceRepository.GetByIdAsync(req.ServiceId.Value)
                    ?? throw new NotFoundException("ClinicService", req.ServiceId.Value);
                if (service.ClinicId != req.ClinicId || !service.IsActive)
                    throw new ValidationException("ServiceId", "Dịch vụ không thuộc phòng khám hoặc đã ngừng hoạt động.");
                durationMins = service.DurationMins;
            }
            int bufferMins = clinic.AppointmentBufferMins;
            int totalSlotMins = durationMins + bufferMins;
            var endTime = req.StartTime.AddMinutes(totalSlotMins);

            if (!Enum.TryParse<AppointmentType>(req.AppointmentType, true, out var apptType))
                throw new ValidationException("AppointmentType", $"Loại lịch hẹn không hợp lệ: {req.AppointmentType}");

            var vetClinic = await _vetClinicRepository.GetActiveByVetClinicIdAndClinicIdAsync(
                req.VetClinicId.Value,
                req.ClinicId)
                ?? throw new ValidationException("VetClinicId", "Bác sĩ không thuộc phòng khám hoặc đã ngừng hoạt động.");

            var allVetClinicIds = await _vetClinicRepository.GetAllVetClinicIdsAsync(vetClinic.VetProfileId);

            bool hasConflict = await _appointmentRepository.HasDoctorConflictAcrossClinicsAsync(
                allVetClinicIds, req.AppointmentDate, req.StartTime, endTime);

            if (hasConflict)
                throw new ConflictException("Bác sĩ đã có lịch hẹn trong khung giờ này tại một phòng khám khác.");

            var appointment = AppointmentDomain.Book(
                clinicId: req.ClinicId,
                petId: req.PetId,
                bookedByUserId: command.OwnerUserId,
                appointmentDate: req.AppointmentDate,
                startTime: req.StartTime,
                endTime: endTime,
                appointmentType: apptType,
                serviceId: req.ServiceId,
                notes: req.Notes);

            appointment.AssignDoctor(req.VetClinicId.Value);

            await _appointmentRepository.AddAsync(appointment);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            try
            {
                var reminders = await _reminderAutoCreator.CreateReminderFromAppointmentAsync(
                    appointment.Id, req.PetId, command.OwnerUserId,
                    req.AppointmentDate, pet.Name, cancellationToken);

                if (reminders.Count > 0)
                {
                    await _reminderRepository.AddRangeAsync(reminders);
                    await _unitOfWork.SaveChangesAsync(cancellationToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Appointment {AppointmentId} was booked but reminder creation failed.", appointment.Id);
            }

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
