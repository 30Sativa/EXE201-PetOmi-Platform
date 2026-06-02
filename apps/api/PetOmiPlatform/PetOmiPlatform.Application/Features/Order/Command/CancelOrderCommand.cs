using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;

namespace PetOmiPlatform.Application.Features.Order.Command
{
    public record CancelOrderCommand(Guid ClinicId, Guid StaffUserId, Guid OrderId)
        : IRequest<bool>, IAuditableCommand
    {
        public Guid? UserId => StaffUserId;
        public string Action => "CancelOrder";
        public string Category => "Order";
    }
}
