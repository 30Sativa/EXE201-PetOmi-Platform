using PetOmiPlatform.Application.Features.Order.DTOs.Response;
using PetOmiPlatform.Domain.Entities;

namespace PetOmiPlatform.Application.Features.Order.Mappers
{
    public static class OrderResponseMapper
    {
        public static OrderResponse ToResponse(this OrderDomain order, IEnumerable<OrderItemDomain> items)
        {
            return new OrderResponse
            {
                OrderId = order.Id,
                ClinicId = order.ClinicId,
                CustomerUserId = order.CustomerUserId,
                PetId = order.PetId,
                AppointmentId = order.AppointmentId,
                OrderType = order.OrderType.ToString(),
                Status = order.Status.ToString(),
                TotalAmount = order.TotalAmount,
                Notes = order.Notes,
                CreatedAt = order.CreatedAt,
                ConfirmedAt = order.ConfirmedAt,
                PaidAt = order.PaidAt,
                Items = items.Select(x => new OrderItemResponse
                {
                    OrderItemId = x.Id,
                    InventoryItemId = x.InventoryItemId,
                    Description = x.Description,
                    Quantity = x.Quantity,
                    UnitPrice = x.UnitPrice,
                    TotalPrice = x.TotalPrice,
                    SourceType = x.SourceType.ToString(),
                    PrescriptionId = x.PrescriptionId
                }).ToList()
            };
        }
    }
}
