using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Exceptions;

namespace PetOmiPlatform.Domain.Entities
{
    public class InvoiceItemDomain : BaseEntity
    {
        public Guid InvoiceId { get; private set; }
        public InvoiceItemType ItemType { get; private set; }
        public string Description { get; private set; } = string.Empty;
        public int Quantity { get; private set; }
        public decimal UnitPrice { get; private set; }
        public decimal TotalPrice { get; private set; }     // Quantity * UnitPrice
        public Guid? ServiceId { get; private set; }
        public Guid? InventoryItemId { get; private set; }
        public Guid? OrderItemId { get; private set; }
        public Guid? PrescriptionId { get; private set; }

        private InvoiceItemDomain() { }

        public static InvoiceItemDomain Create(
            Guid invoiceId,
            InvoiceItemType itemType,
            string description,
            int quantity,
            decimal unitPrice,
            Guid? serviceId = null,
            Guid? inventoryItemId = null,
            Guid? orderItemId = null,
            Guid? prescriptionId = null)
        {
            if (string.IsNullOrWhiteSpace(description))
                throw new DomainException("Mô tả dòng hóa đơn không được để trống.");
            if (quantity <= 0)
                throw new DomainException("Số lượng phải lớn hơn 0.");
            if (unitPrice < 0)
                throw new DomainException("Đơn giá không được âm.");

            return new InvoiceItemDomain
            {
                Id = Guid.NewGuid(),
                InvoiceId = invoiceId,
                ItemType = itemType,
                Description = description.Trim(),
                Quantity = quantity,
                UnitPrice = unitPrice,
                TotalPrice = quantity * unitPrice,
                ServiceId = serviceId,
                InventoryItemId = inventoryItemId,
                OrderItemId = orderItemId,
                PrescriptionId = prescriptionId
            };
        }

        public static InvoiceItemDomain Reconstitute(
            Guid id, Guid invoiceId, InvoiceItemType itemType,
            string description, int quantity, decimal unitPrice, decimal totalPrice,
            Guid? serviceId, Guid? inventoryItemId, Guid? orderItemId, Guid? prescriptionId)
        {
            return new InvoiceItemDomain
            {
                Id = id,
                InvoiceId = invoiceId,
                ItemType = itemType,
                Description = description,
                Quantity = quantity,
                UnitPrice = unitPrice,
                TotalPrice = totalPrice,
                ServiceId = serviceId,
                InventoryItemId = inventoryItemId,
                OrderItemId = orderItemId,
                PrescriptionId = prescriptionId
            };
        }
    }
}
