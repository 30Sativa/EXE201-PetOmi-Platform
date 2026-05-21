using MediatR;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Appointment.Command;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Response;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Appointment.Handler
{
    public class RejectAppointmentCommandHandler
        : IRequestHandler<RejectAppointmentCommand, AppointmentResponse>
    {
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IUnitOfWork _unitOfWork;

        public RejectAppointmentCommandHandler(
            IAppointmentRepository appointmentRepository,
            IUnitOfWork unitOfWork)
        {
            _appointmentRepository = appointmentRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<AppointmentResponse> Handle(
            RejectAppointmentCommand command, CancellationToken cancellationToken)
        {
            var appointment = await _appointmentRepository.GetByIdAsync(command.AppointmentId)
                ?? throw new NotFoundException("Appointment", command.AppointmentId);

            appointment.Reject(command.Request.Reason);

            await _appointmentRepository.UpdateAsync(appointment);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return AppointmentHandlerHelper.ToResponse(appointment);
        }
    }
}
