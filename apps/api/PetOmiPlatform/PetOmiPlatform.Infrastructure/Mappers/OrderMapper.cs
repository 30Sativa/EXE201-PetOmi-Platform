using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;

namespace PetOmiPlatform.Infrastructure.Mappers
{
    public static class OrderMapper
    {
        public static OrderDomain ToDomain(this Order entity) =>
            OrderDomain.Reconstitute(
                id: entity.OrderId,
                clinicId: entity.ClinicId,
                customerUserId: entity.CustomerUserId,
                petId: entity.PetId,
                appointmentId: entity.AppointmentId,
                orderType: Enum.Parse<OrderType>(entity.OrderType),
                status: Enum.Parse<OrderStatus>(entity.Status),
                totalAmount: entity.TotalAmount,
                notes: entity.Notes,
                createdByUserId: entity.CreatedByUserId,
                createdAt: entity.CreatedAt,
                updatedAt: entity.UpdatedAt,
                confirmedAt: entity.ConfirmedAt,
                paidAt: entity.PaidAt,
                cancelledAt: entity.CancelledAt);

        public static Order ToEntity(this OrderDomain domain) =>
            new Order
            {
                OrderId = domain.Id,
                ClinicId = domain.ClinicId,
                CustomerUserId = domain.CustomerUserId,
                PetId = domain.PetId,
                AppointmentId = domain.AppointmentId,
                OrderType = domain.OrderType.ToString(),
                Status = domain.Status.ToString(),
                TotalAmount = domain.TotalAmount,
                Notes = domain.Notes,
                CreatedByUserId = domain.CreatedByUserId,
                CreatedAt = domain.CreatedAt,
                UpdatedAt = domain.UpdatedAt,
                ConfirmedAt = domain.ConfirmedAt,
                PaidAt = domain.PaidAt,
                CancelledAt = domain.CancelledAt
            };

        public static OrderItemDomain ToDomain(this OrderItem entity) =>
            OrderItemDomain.Reconstitute(
                id: entity.OrderItemId,
                orderId: entity.OrderId,
                inventoryItemId: entity.InventoryItemId,
                description: entity.Description,
                quantity: entity.Quantity,
                unitPrice: entity.UnitPrice,
                totalPrice: entity.TotalPrice,
                sourceType: Enum.Parse<OrderItemSourceType>(entity.SourceType),
                prescriptionId: entity.PrescriptionId,
                createdAt: entity.CreatedAt);

        public static OrderItem ToEntity(this OrderItemDomain domain) =>
            new OrderItem
            {
                OrderItemId = domain.Id,
                OrderId = domain.OrderId,
                InventoryItemId = domain.InventoryItemId,
                Description = domain.Description,
                Quantity = domain.Quantity,
                UnitPrice = domain.UnitPrice,
                TotalPrice = domain.TotalPrice,
                SourceType = domain.SourceType.ToString(),
                PrescriptionId = domain.PrescriptionId,
                CreatedAt = domain.CreatedAt
            };
    }
}
