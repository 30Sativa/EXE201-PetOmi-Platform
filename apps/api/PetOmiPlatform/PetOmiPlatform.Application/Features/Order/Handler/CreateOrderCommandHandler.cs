using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Features.Order.Command;
using PetOmiPlatform.Application.Features.Order.DTOs.Response;
using PetOmiPlatform.Application.Features.Order.Mappers;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Order.Handler
{
    public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, OrderResponse>
    {
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IInventoryRepository _inventoryRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CreateOrderCommandHandler(
            IAppointmentRepository appointmentRepository,
            IInventoryRepository inventoryRepository,
            IOrderRepository orderRepository,
            IVetClinicRepository vetClinicRepository,
            IUnitOfWork unitOfWork)
        {
            _appointmentRepository = appointmentRepository;
            _inventoryRepository = inventoryRepository;
            _orderRepository = orderRepository;
            _vetClinicRepository = vetClinicRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<OrderResponse> Handle(CreateOrderCommand request, CancellationToken cancellationToken)
        {
            var payload = request.Payload;
            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(request.StaffUserId, payload.ClinicId);
            ClinicRoleGuard.RequireInvoiceWriter(staff);

            if (!Enum.TryParse<OrderType>(payload.OrderType, true, out var orderType))
                throw new ValidationException("OrderType", $"Loai don hang khong hop le: {payload.OrderType}");

            if (payload.AppointmentId.HasValue)
            {
                var appointment = await _appointmentRepository.GetByIdAsync(payload.AppointmentId.Value)
                    ?? throw new NotFoundException("Appointment", payload.AppointmentId.Value);
                if (appointment.ClinicId != payload.ClinicId)
                    throw new ValidationException("AppointmentId", "Lich hen khong thuoc phong kham nay.");
            }

            var order = OrderDomain.Create(
                clinicId: payload.ClinicId,
                createdByUserId: request.StaffUserId,
                orderType: orderType,
                customerUserId: payload.CustomerUserId,
                petId: payload.PetId,
                appointmentId: payload.AppointmentId,
                notes: payload.Notes);

            var items = new List<OrderItemDomain>();
            foreach (var itemRequest in payload.Items)
            {
                var inventory = await _inventoryRepository.GetByIdAsync(itemRequest.InventoryItemId)
                    ?? throw new NotFoundException("InventoryItem", itemRequest.InventoryItemId);
                if (inventory.ClinicId != payload.ClinicId || !inventory.IsActive)
                    throw new ValidationException("InventoryItemId", $"Mat hang '{inventory.ItemName}' khong thuoc clinic hoac da ngung ban.");
                if (itemRequest.Quantity > inventory.Quantity)
                    throw new ValidationException("Quantity", $"Ton kho '{inventory.ItemName}' khong du. Hien co: {inventory.Quantity}.");
                if (!Enum.TryParse<OrderItemSourceType>(itemRequest.SourceType, true, out var sourceType))
                    throw new ValidationException("SourceType", $"Nguon dong hang khong hop le: {itemRequest.SourceType}");

                var unitPrice = itemRequest.UnitPrice ?? inventory.UnitPrice ?? 0m;
                var description = string.IsNullOrWhiteSpace(itemRequest.Description)
                    ? inventory.ItemName
                    : itemRequest.Description;

                items.Add(OrderItemDomain.Create(
                    orderId: order.Id,
                    inventoryItemId: inventory.Id,
                    description: description,
                    quantity: itemRequest.Quantity,
                    unitPrice: unitPrice,
                    sourceType: sourceType,
                    prescriptionId: itemRequest.PrescriptionId));
            }

            order.UpdateTotal(items.Sum(x => x.TotalPrice));
            if (payload.ConfirmImmediately)
                order.Confirm();

            await _orderRepository.AddAsync(order);
            await _orderRepository.AddItemsAsync(items);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return order.ToResponse(items);
        }
    }
}
