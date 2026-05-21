using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Request;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Clinic.Command
{
    public record AddInventoryItemCommand(Guid UserId, Guid ClinicId, AddInventoryItemRequest Request)
        : IRequest<InventoryItemResponse>, IAuditableCommand
    {
        Guid? IAuditableCommand.UserId => UserId;
        string IAuditableCommand.Action => "AddInventoryItem";
        string IAuditableCommand.Category => "Inventory";
    }
}
