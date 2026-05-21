using MediatR;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Appointment.Command;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Response;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Appointment.Handler
{
    public class CancelAppointmentCommandHandler
        : IRequestHandler<CancelAppointmentCommand, AppointmentResponse>
    {
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CancelAppointmentCommandHandler(
            IAppointmentRepository appointmentRepository,
            IUnitOfWork unitOfWork)
        {
            _appointmentRepository = appointmentRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<AppointmentResponse> Handle(
            CancelAppointmentCommand command, CancellationToken cancellationToken)
        {
            var appointment = await _appointmentRepository.GetByIdAsync(command.AppointmentId)
                ?? throw new NotFoundException("Appointment", command.AppointmentId);

            appointment.Cancel(command.UserId_Cancel, command.Request.Reason);

            await _appointmentRepository.UpdateAsync(appointment);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return AppointmentHandlerHelper.ToResponse(appointment);
        }
    }
}
