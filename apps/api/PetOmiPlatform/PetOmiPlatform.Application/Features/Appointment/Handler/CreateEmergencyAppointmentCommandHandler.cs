using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Appointment.Command;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Response;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Appointment.Handler;

public class CreateEmergencyAppointmentCommandHandler
    : IRequestHandler<CreateEmergencyAppointmentCommand, AppointmentResponse>
{
    private readonly IClinicRepository _clinicRepository;
    private readonly IClinicServiceRepository _serviceRepository;
    private readonly IAppointmentRepository _appointmentRepository;
    private readonly IVetClinicRepository _vetClinicRepository;
    private readonly IPetRepository _petRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateEmergencyAppointmentCommandHandler(
        IClinicRepository clinicRepository,
        IClinicServiceRepository serviceRepository,
        IAppointmentRepository appointmentRepository,
        IVetClinicRepository vetClinicRepository,
        IPetRepository petRepository,
        IUnitOfWork unitOfWork)
    {
        _clinicRepository = clinicRepository;
        _serviceRepository = serviceRepository;
        _appointmentRepository = appointmentRepository;
        _vetClinicRepository = vetClinicRepository;
        _petRepository = petRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<AppointmentResponse> Handle(
        CreateEmergencyAppointmentCommand command, CancellationToken cancellationToken)
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

        VetClinicDomain? vetClinic = null;
        if (req.VetClinicId.HasValue)
        {
            vetClinic = await _vetClinicRepository.GetActiveByVetClinicIdAndClinicIdAsync(
                req.VetClinicId.Value,
                req.ClinicId)
                ?? throw new ValidationException("VetClinicId", "Bác sĩ không thuộc phòng khám hoặc đã ngừng hoạt động.");

            if (!req.ForceConflictOverride)
            {
                var allVetClinicIds = await _vetClinicRepository.GetAllVetClinicIdsAsync(vetClinic.VetProfileId);
                var hasConflict = await _appointmentRepository.HasDoctorConflictAcrossClinicsAsync(
                    allVetClinicIds, req.AppointmentDate, req.StartTime, req.EndTime);

                if (hasConflict)
                    throw new ConflictException(
                        "Bác sĩ đã có lịch trong khung giờ này. Nếu vẫn muốn tạo lịch cấp cứu, hãy đặt ForceConflictOverride = true.");
            }
        }

        int durationMins = 30;
        if (req.ServiceId.HasValue)
        {
            var service = await _serviceRepository.GetByIdAsync(req.ServiceId.Value);
            if (service == null)
                throw new NotFoundException("ClinicService", req.ServiceId.Value);
            if (service.ClinicId != req.ClinicId || !service.IsActive)
                throw new ValidationException("ServiceId", "Dịch vụ không thuộc phòng khám hoặc đã ngừng hoạt động.");

            durationMins = service.DurationMins;
        }

        var endTime = req.EndTime;
        if (endTime <= req.StartTime)
        {
            endTime = req.StartTime.AddMinutes(durationMins + clinic.AppointmentBufferMins);
        }

        var appointment = AppointmentDomain.CreateEmergency(
            clinicId: req.ClinicId,
            petId: req.PetId,
            staffUserId: command.StaffUserId,
            appointmentDate: req.AppointmentDate,
            startTime: req.StartTime,
            endTime: endTime,
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
