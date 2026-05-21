using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Request;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Clinic.Command
{
    public record StockInCommand(Guid UserId, Guid ClinicId, Guid ItemId, StockAdjustRequest Request)
        : IRequest<InventoryItemResponse>, IAuditableCommand
    {
        Guid? IAuditableCommand.UserId => UserId;
        string IAuditableCommand.Action => "StockIn";
        string IAuditableCommand.Category => "Inventory";
    }
}
