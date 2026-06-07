using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Request;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Appointment.Command
{
    public record CreateGuestEmergencyIntakeCommand(
        Guid StaffUserId,
        CreateGuestWalkInIntakeRequest Request
    ) : IRequest<GuestWalkInIntakeResponse>, IAuditableCommand
    {
        public Guid? UserId => StaffUserId;
        public string Action => "CreateGuestEmergencyIntake";
        public string Category => "Appointment";
    }
}
