using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.Appointment.CheckIn.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Appointment.CheckIn.Command
{
    public record CheckInCommand(
        Guid AppointmentId,
        Guid ClinicId,
        Guid StaffUserId
    ) : IRequest<CheckInResponse>, IAuditableCommand
    {
        public Guid? UserId => StaffUserId;
        public string Action => "CheckIn";
        public string Category => "Appointment";
    }
}
