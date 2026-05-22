using MediatR;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Appointment.Command;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Response;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Appointment.Handler
{
    public class CompleteAppointmentCommandHandler
        : IRequestHandler<CompleteAppointmentCommand, AppointmentResponse>
    {
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CompleteAppointmentCommandHandler(
            IAppointmentRepository appointmentRepository,
            IUnitOfWork unitOfWork)
        {
            _appointmentRepository = appointmentRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<AppointmentResponse> Handle(
            CompleteAppointmentCommand command, CancellationToken cancellationToken)
        {
            var appointment = await _appointmentRepository.GetByIdAsync(command.AppointmentId)
                ?? throw new NotFoundException("Appointment", command.AppointmentId);

            appointment.Complete();

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
