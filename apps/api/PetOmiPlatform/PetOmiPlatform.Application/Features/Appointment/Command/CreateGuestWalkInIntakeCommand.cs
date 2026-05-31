using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Request;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Appointment.Command
{
    public record CreateGuestWalkInIntakeCommand(
        Guid StaffUserId,
        CreateGuestWalkInIntakeRequest Request
    ) : IRequest<GuestWalkInIntakeResponse>, IAuditableCommand
    {
        public Guid? UserId => StaffUserId;
        public string Action => "CreateGuestWalkInIntake";
        public string Category => "Appointment";
    }
}
