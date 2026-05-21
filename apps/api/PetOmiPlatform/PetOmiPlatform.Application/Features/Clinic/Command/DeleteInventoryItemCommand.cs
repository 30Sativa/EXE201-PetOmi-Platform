using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;

namespace PetOmiPlatform.Application.Features.Clinic.Command
{
    public record DeleteInventoryItemCommand(Guid UserId, Guid ClinicId, Guid ItemId)
        : IRequest<Unit>, IAuditableCommand
    {
        Guid? IAuditableCommand.UserId => UserId;
        string IAuditableCommand.Action => "DeleteInventoryItem";
        string IAuditableCommand.Category => "Inventory";
    }
}
