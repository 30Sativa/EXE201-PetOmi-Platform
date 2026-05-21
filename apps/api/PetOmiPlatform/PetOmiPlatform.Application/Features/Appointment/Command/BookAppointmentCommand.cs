using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Request;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Appointment.Command
{
    public record BookAppointmentCommand(
        Guid OwnerUserId,
        BookAppointmentRequest Request
    ) : IRequest<AppointmentResponse>, IAuditableCommand
    {
        public Guid? UserId => OwnerUserId;
        public string Action => "BookAppointment";
        public string Category => "Appointment";
    }
}
