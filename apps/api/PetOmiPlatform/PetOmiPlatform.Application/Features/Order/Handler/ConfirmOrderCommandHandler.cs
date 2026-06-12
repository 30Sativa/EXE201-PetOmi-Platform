using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Features.Order.Command;
using PetOmiPlatform.Application.Features.Order.DTOs.Response;
using PetOmiPlatform.Application.Features.Order.Mappers;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Order.Handler
{
    public class ConfirmOrderCommandHandler : IRequestHandler<ConfirmOrderCommand, OrderResponse>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IUnitOfWork _unitOfWork;

        public ConfirmOrderCommandHandler(
            IOrderRepository orderRepository,
            IVetClinicRepository vetClinicRepository,
            IUnitOfWork unitOfWork)
        {
            _orderRepository = orderRepository;
            _vetClinicRepository = vetClinicRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<OrderResponse> Handle(ConfirmOrderCommand request, CancellationToken cancellationToken)
        {
            var order = await _orderRepository.GetByIdAsync(request.OrderId)
                ?? throw new NotFoundException("Order", request.OrderId);
            if (order.ClinicId != request.ClinicId)
                throw new ForbiddenException("Không có quyền xác nhận đơn hàng này.");

            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(request.StaffUserId, request.ClinicId);
            ClinicRoleGuard.RequireInvoiceWriter(staff);

            order.Confirm();
            await _orderRepository.UpdateAsync(order);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var items = await _orderRepository.GetItemsByOrderIdAsync(order.Id);
            return order.ToResponse(items);
        }
    }
}
