using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Features.Order.Command;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Order.Handler
{
    public class CancelOrderCommandHandler : IRequestHandler<CancelOrderCommand, bool>
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CancelOrderCommandHandler(
            IOrderRepository orderRepository,
            IVetClinicRepository vetClinicRepository,
            IUnitOfWork unitOfWork)
        {
            _orderRepository = orderRepository;
            _vetClinicRepository = vetClinicRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<bool> Handle(CancelOrderCommand request, CancellationToken cancellationToken)
        {
            var order = await _orderRepository.GetByIdAsync(request.OrderId)
                ?? throw new NotFoundException("Order", request.OrderId);
            if (order.ClinicId != request.ClinicId)
                throw new ForbiddenException("Không có quyền hủy đơn hàng này.");

            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(request.StaffUserId, request.ClinicId);
            ClinicRoleGuard.RequireInvoiceWriter(staff);

            order.Cancel();
            await _orderRepository.UpdateAsync(order);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
}
