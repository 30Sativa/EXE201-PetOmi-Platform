using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Features.Order.DTOs.Response;
using PetOmiPlatform.Application.Features.Order.Mappers;
using PetOmiPlatform.Application.Features.Order.Query;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Order.Handler
{
    public class GetOrderByIdQueryHandler : IRequestHandler<GetOrderByIdQuery, OrderResponse?>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IVetClinicRepository _vetClinicRepository;

        public GetOrderByIdQueryHandler(
            IOrderRepository orderRepository,
            IVetClinicRepository vetClinicRepository)
        {
            _orderRepository = orderRepository;
            _vetClinicRepository = vetClinicRepository;
        }

        public async Task<OrderResponse?> Handle(GetOrderByIdQuery request, CancellationToken cancellationToken)
        {
            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(request.StaffUserId, request.ClinicId);
            ClinicRoleGuard.RequireActiveStaff(staff);

            var order = await _orderRepository.GetByIdAsync(request.OrderId);
            if (order == null)
                return null;
            if (order.ClinicId != request.ClinicId)
                throw new ForbiddenException("Không có quyền xem đơn hàng này.");

            var items = await _orderRepository.GetItemsByOrderIdAsync(order.Id);
            return order.ToResponse(items);
        }
    }
}
