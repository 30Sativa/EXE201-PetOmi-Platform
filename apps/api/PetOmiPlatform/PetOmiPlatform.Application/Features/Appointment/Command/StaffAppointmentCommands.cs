using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Request;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Appointment.Command
{
    public record ConfirmAppointmentCommand(
        Guid AppointmentId,
        Guid StaffUserId
    ) : IRequest<AppointmentResponse>, IAuditableCommand
    {
        public Guid? UserId => StaffUserId;
        public string Action => "ConfirmAppointment";
        public string Category => "Appointment";
    }

    public record RejectAppointmentCommand(
        Guid AppointmentId,
        Guid StaffUserId,
        RejectAppointmentRequest Request
    ) : IRequest<AppointmentResponse>, IAuditableCommand
    {
        public Guid? UserId => StaffUserId;
        public string Action => "RejectAppointment";
        public string Category => "Appointment";
    }

    public record CompleteAppointmentCommand(
        Guid AppointmentId,
        Guid StaffUserId
    ) : IRequest<AppointmentResponse>, IAuditableCommand
    {
        public Guid? UserId => StaffUserId;
        public string Action => "CompleteAppointment";
        public string Category => "Appointment";
    }
}
