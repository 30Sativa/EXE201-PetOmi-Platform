using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Appointment.Command;

/// <summary>
/// Staff đánh dấu owner không đến (Confirmed -> NoShow).
/// </summary>
public record MarkNoShowCommand(
    Guid AppointmentId,
    Guid StaffUserId
) : IRequest<AppointmentResponse>, IAuditableCommand
{
    public Guid? UserId => StaffUserId;
    public string Action => "MarkNoShow";
    public string Category => "Appointment";
}
