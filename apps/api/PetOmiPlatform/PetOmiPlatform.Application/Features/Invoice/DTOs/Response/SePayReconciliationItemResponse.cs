namespace PetOmiPlatform.Application.Features.Invoice.DTOs.Response
{
    public class SePayReconciliationItemResponse
    {
        public Guid PaymentTransactionId { get; set; }
        public string ProviderTransactionId { get; set; } = string.Empty;
        public string TransferType { get; set; } = string.Empty;
        public decimal TransferAmount { get; set; }
        public DateTime? TransactionDate { get; set; }
        public string? ReferenceCode { get; set; }
        public string? TransferContent { get; set; }
        public string Status { get; set; } = string.Empty;
        public Guid? InvoiceId { get; set; }
        public string? InvoiceCode { get; set; }
        public decimal? InvoiceFinalAmount { get; set; }
        public string? ReviewNote { get; set; }
        public Guid? ReviewedByUserId { get; set; }
        public DateTime? ReviewedAt { get; set; }
    }
}
