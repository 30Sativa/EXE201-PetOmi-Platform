namespace PetOmiPlatform.Application.Features.Invoice.DTOs.Request
{
    public class InvoiceItemRequest
    {
        public string ItemType { get; set; } = "Service";
        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; } = 1;
        public decimal UnitPrice { get; set; }
        public Guid? ServiceId { get; set; }
        public Guid? InventoryItemId { get; set; }
        public Guid? OrderItemId { get; set; }
        public Guid? PrescriptionId { get; set; }
    }

    public class CreateInvoiceRequest
    {
        public Guid? AppointmentId { get; set; }
        public Guid? OrderId { get; set; }
        public Guid? ExaminationId { get; set; }
        public string? InvoiceSource { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal DiscountAmount { get; set; } = 0;
        public string? Notes { get; set; }

        public List<InvoiceItemRequest> Items { get; set; } = new();
    }
}
