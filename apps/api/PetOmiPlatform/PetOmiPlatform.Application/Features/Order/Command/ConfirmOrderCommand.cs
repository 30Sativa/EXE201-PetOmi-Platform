using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.Order.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Order.Command
{
    public record ConfirmOrderCommand(Guid ClinicId, Guid StaffUserId, Guid OrderId)
        : IRequest<OrderResponse>, IAuditableCommand
    {
        public Guid? UserId => StaffUserId;
        public string Action => "ConfirmOrder";
        public string Category => "Order";
    }
}
