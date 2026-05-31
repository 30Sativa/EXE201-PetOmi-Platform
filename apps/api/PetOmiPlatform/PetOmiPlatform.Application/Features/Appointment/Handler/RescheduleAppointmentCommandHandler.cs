using MediatR;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Appointment.Command;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Response;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Appointment.Handler
{
    public class RescheduleAppointmentCommandHandler
        : IRequestHandler<RescheduleAppointmentCommand, AppointmentResponse>
    {
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IUnitOfWork _unitOfWork;

        public RescheduleAppointmentCommandHandler(
            IAppointmentRepository appointmentRepository,
            IVetClinicRepository vetClinicRepository,
            IUnitOfWork unitOfWork)
        {
            _appointmentRepository = appointmentRepository;
            _vetClinicRepository = vetClinicRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<AppointmentResponse> Handle(
            RescheduleAppointmentCommand command, CancellationToken cancellationToken)
        {
            var appointment = await _appointmentRepository.GetByIdAsync(command.AppointmentId)
                ?? throw new NotFoundException("Appointment", command.AppointmentId);

            if (appointment.BookedByUserId != command.OwnerUserId)
                throw new ForbiddenException("Ban khong co quyen doi lich hen nay.");

            var req = command.Request;

            if (appointment.VetClinicId.HasValue)
            {
                var vetClinic = await _vetClinicRepository.GetByVetClinicIdAsync(appointment.VetClinicId.Value)
                    ?? throw new NotFoundException("VetClinic", appointment.VetClinicId.Value);
                var allVetClinicIds = await _vetClinicRepository.GetAllVetClinicIdsAsync(vetClinic.VetProfileId);
                var hasConflict = await _appointmentRepository.HasDoctorConflictAcrossClinicsAsync(
                    allVetClinicIds, req.NewDate, req.NewStartTime, req.NewEndTime, appointment.Id);

                if (hasConflict)
                    throw new ConflictException("Bác sĩ đã có lịch trong khung giờ này. Vui lòng chọn giờ khác.");
            }

            appointment.Reschedule(req.NewDate, req.NewStartTime, req.NewEndTime);

            await _appointmentRepository.UpdateAsync(appointment);
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
