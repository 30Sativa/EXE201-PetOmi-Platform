namespace PetOmiPlatform.Application.Features.Invoice.DTOs.Response
{
    public class InvoiceItemResponse
    {
        public Guid Id { get; set; }
        public string ItemType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public Guid? ServiceId { get; set; }
        public Guid? InventoryItemId { get; set; }
    }

    public class InvoiceResponse
    {
        public Guid Id { get; set; }
        public Guid AppointmentId { get; set; }
        public Guid? ExaminationId { get; set; }
        public Guid ClinicId { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal FinalAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? PaymentMethod { get; set; }
        public string? Notes { get; set; }
        public DateTime? PaidAt { get; set; }
        public DateTime CreatedAt { get; set; }
        
        public List<InvoiceItemResponse> Items { get; set; } = new();
    }
}
