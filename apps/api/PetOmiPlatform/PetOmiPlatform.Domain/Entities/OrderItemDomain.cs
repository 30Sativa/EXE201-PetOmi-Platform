using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Exceptions;

namespace PetOmiPlatform.Domain.Entities
{
    public class OrderItemDomain : BaseEntity
    {
        public Guid OrderId { get; private set; }
        public Guid InventoryItemId { get; private set; }
        public string Description { get; private set; } = string.Empty;
        public int Quantity { get; private set; }
        public decimal UnitPrice { get; private set; }
        public decimal TotalPrice { get; private set; }
        public OrderItemSourceType SourceType { get; private set; }
        public Guid? PrescriptionId { get; private set; }
        public DateTime CreatedAt { get; private set; }

        private OrderItemDomain() { }

        public static OrderItemDomain Create(
            Guid orderId,
            Guid inventoryItemId,
            string description,
            int quantity,
            decimal unitPrice,
            OrderItemSourceType sourceType = OrderItemSourceType.Retail,
            Guid? prescriptionId = null)
        {
            if (orderId == Guid.Empty)
                throw new DomainException("OrderId khong hop le.");
            if (inventoryItemId == Guid.Empty)
                throw new DomainException("Mat hang khong hop le.");
            if (string.IsNullOrWhiteSpace(description))
                throw new DomainException("Mo ta dong hang khong duoc de trong.");
            if (quantity <= 0)
                throw new DomainException("So luong phai lon hon 0.");
            if (unitPrice < 0)
                throw new DomainException("Don gia khong duoc am.");

            return new OrderItemDomain
            {
                Id = Guid.NewGuid(),
                OrderId = orderId,
                InventoryItemId = inventoryItemId,
                Description = description.Trim(),
                Quantity = quantity,
                UnitPrice = unitPrice,
                TotalPrice = quantity * unitPrice,
                SourceType = sourceType,
                PrescriptionId = prescriptionId,
                CreatedAt = DateTime.UtcNow
            };
        }

        public static OrderItemDomain Reconstitute(
            Guid id,
            Guid orderId,
            Guid inventoryItemId,
            string description,
            int quantity,
            decimal unitPrice,
            decimal totalPrice,
            OrderItemSourceType sourceType,
            Guid? prescriptionId,
            DateTime createdAt)
        {
            return new OrderItemDomain
            {
                Id = id,
                OrderId = orderId,
                InventoryItemId = inventoryItemId,
                Description = description,
                Quantity = quantity,
                UnitPrice = unitPrice,
                TotalPrice = totalPrice,
                SourceType = sourceType,
                PrescriptionId = prescriptionId,
                CreatedAt = createdAt
            };
        }
    }
}
