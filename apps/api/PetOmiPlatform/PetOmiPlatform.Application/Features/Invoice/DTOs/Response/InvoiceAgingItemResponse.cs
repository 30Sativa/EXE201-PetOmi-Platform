namespace PetOmiPlatform.Application.Features.Invoice.DTOs.Response
{
    public class InvoiceAgingItemResponse
    {
        public Guid InvoiceId { get; set; }
        public string InvoiceCode { get; set; } = string.Empty;
        public Guid? AppointmentId { get; set; }
        public Guid? OrderId { get; set; }
        public Guid ClinicId { get; set; }
        public string InvoiceSource { get; set; } = string.Empty;
        public decimal FinalAmount { get; set; }
        public int PendingDays { get; set; }
        public string PaymentProvider { get; set; } = string.Empty;
        public string? PaymentReference { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
