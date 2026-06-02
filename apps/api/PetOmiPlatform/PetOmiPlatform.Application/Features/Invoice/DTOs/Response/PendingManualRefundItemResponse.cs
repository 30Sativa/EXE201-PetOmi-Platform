namespace PetOmiPlatform.Application.Features.Invoice.DTOs.Response
{
    public class PendingManualRefundItemResponse
    {
        public Guid InvoiceId { get; set; }
        public string InvoiceCode { get; set; } = string.Empty;
        public Guid? AppointmentId { get; set; }
        public Guid? OrderId { get; set; }
        public string InvoiceSource { get; set; } = string.Empty;
        public decimal FinalAmount { get; set; }
        public decimal? PaidAmount { get; set; }
        public DateTime? CancelledAt { get; set; }
        public string? CancellationReason { get; set; }
        public int PendingDays { get; set; }
    }
}
