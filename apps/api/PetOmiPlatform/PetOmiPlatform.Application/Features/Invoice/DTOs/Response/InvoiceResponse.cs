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
        public string InvoiceCode { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal FinalAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public string PaymentProvider { get; set; } = string.Empty;
        public string? PaymentReference { get; set; }
        public string? QrCodeUrl { get; set; }
        public string? BankAccountNo { get; set; }
        public string? BankCode { get; set; }
        public decimal? PaidAmount { get; set; }
        public DateTime? PaymentWebhookAt { get; set; }
        public string? PaymentMethod { get; set; }
        public string? Notes { get; set; }
        public DateTime? PaidAt { get; set; }
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// Cac canh bao nghiep vu de FE hien thi cho thu ngan truoc khi thu tien.
        /// Vi du: dong thuoc auto-compose chua co don gia (UnitPrice = 0).
        /// </summary>
        public List<string> Warnings { get; set; } = new();

        public List<InvoiceItemResponse> Items { get; set; } = new();
    }
}
