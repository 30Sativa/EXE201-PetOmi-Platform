using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Request;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Appointment.Command
{
    public record CancelAppointmentCommand(
        Guid AppointmentId,
        Guid UserId_Cancel,
        CancelAppointmentRequest Request
    ) : IRequest<AppointmentResponse>, IAuditableCommand
    {
        public Guid? UserId => UserId_Cancel;
        public string Action => "CancelAppointment";
        public string Category => "Appointment";
    }

    public record RescheduleAppointmentCommand(
        Guid AppointmentId,
        Guid OwnerUserId,
        RescheduleAppointmentRequest Request
    ) : IRequest<AppointmentResponse>, IAuditableCommand
    {
        public Guid? UserId => OwnerUserId;
        public string Action => "RescheduleAppointment";
        public string Category => "Appointment";
    }

    public record CreateWalkInAppointmentCommand(
        Guid StaffUserId,
        CreateWalkInRequest Request
    ) : IRequest<AppointmentResponse>, IAuditableCommand
    {
        public Guid? UserId => StaffUserId;
        public string Action => "CreateWalkIn";
        public string Category => "Appointment";
    }
}
