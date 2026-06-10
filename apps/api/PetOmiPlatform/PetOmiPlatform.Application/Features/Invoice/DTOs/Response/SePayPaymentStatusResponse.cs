namespace PetOmiPlatform.Application.Features.Invoice.DTOs.Response
{
    public class SePayPaymentStatusResponse
    {
        public Guid InvoiceId { get; set; }
        public string InvoiceCode { get; set; } = string.Empty;
        public string? PaymentReference { get; set; }
        public string Status { get; set; } = "Pending";
        public string Message { get; set; } = "Đang chờ thanh toán.";
        public bool IsFinal { get; set; }
        public decimal FinalAmount { get; set; }
        public decimal? PaidAmount { get; set; }
        public decimal? ReceivedAmount { get; set; }
        public Guid? PaymentTransactionId { get; set; }
        public string? ProviderTransactionId { get; set; }
        public string? TransferContent { get; set; }
        public DateTime? TransactionDate { get; set; }
    }
}
