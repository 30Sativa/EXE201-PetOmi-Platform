using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Request;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Appointment.Command;

/// <summary>
/// Staff tao emergency appointment (bypass slot check).
/// </summary>
public record CreateEmergencyAppointmentCommand(
    Guid StaffUserId,
    CreateEmergencyRequest Request
) : IRequest<AppointmentResponse>, IAuditableCommand
{
    public Guid? UserId => StaffUserId;
    public string Action => "CreateEmergency";
    public string Category => "Appointment";
}
