using MediatR;
using PetOmiPlatform.Application.Features.Order.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Order.Query
{
    public record GetOrderByIdQuery(Guid ClinicId, Guid StaffUserId, Guid OrderId)
        : IRequest<OrderResponse?>;
}
