using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.Order.DTOs.Request;
using PetOmiPlatform.Application.Features.Order.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Order.Command
{
    public record CreateOrderCommand(Guid StaffUserId, CreateOrderRequest Payload)
        : IRequest<OrderResponse>, IAuditableCommand
    {
        public Guid? UserId => StaffUserId;
        public string Action => "CreateOrder";
        public string Category => "Order";
    }
}
