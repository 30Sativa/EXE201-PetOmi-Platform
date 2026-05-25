using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Appointment.Command;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Response;
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
    private readonly IUnitOfWork _unitOfWork;

    public CreateEmergencyAppointmentCommandHandler(
        IClinicRepository clinicRepository,
        IClinicServiceRepository serviceRepository,
        IAppointmentRepository appointmentRepository,
        IVetClinicRepository vetClinicRepository,
        IUnitOfWork unitOfWork)
    {
        _clinicRepository = clinicRepository;
        _serviceRepository = serviceRepository;
        _appointmentRepository = appointmentRepository;
        _vetClinicRepository = vetClinicRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<AppointmentResponse> Handle(
        CreateEmergencyAppointmentCommand command, CancellationToken cancellationToken)
    {
        var req = command.Request;

        var clinic = await _clinicRepository.GetByIdAsync(req.ClinicId)
            ?? throw new NotFoundException("Clinic", req.ClinicId);
        clinic.EnsureApproved();

        if (req.VetClinicId.HasValue && !req.ForceConflictOverride)
        {
            var vetClinic = await _vetClinicRepository.GetByVetClinicIdAsync(req.VetClinicId.Value);
            if (vetClinic != null)
            {
                var allVetClinicIds = await _vetClinicRepository.GetAllVetClinicIdsAsync(vetClinic.VetProfileId);
                var hasConflict = await _appointmentRepository.HasDoctorConflictAcrossClinicsAsync(
                    allVetClinicIds, req.AppointmentDate, req.StartTime, req.EndTime);

                if (hasConflict)
                    throw new ConflictException(
                        "Bac si da co lich trong khung gio nay. Neu van muon tao emergency, set ForceConflictOverride = true.");
            }
        }

        int durationMins = 30;
        if (req.ServiceId.HasValue)
        {
            var service = await _serviceRepository.GetByIdAsync(req.ServiceId.Value);
            if (service != null)
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
