using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;

namespace PetOmiPlatform.Application.Features.Clinic.Command
{
    public record DeleteClinicServiceCommand(Guid UserId, Guid ClinicId, Guid ServiceId)
        : IRequest<Unit>, IAuditableCommand
    {
        Guid? IAuditableCommand.UserId => UserId;
        string IAuditableCommand.Action => "DeleteClinicService";
        string IAuditableCommand.Category => "Clinic";
    }
}
