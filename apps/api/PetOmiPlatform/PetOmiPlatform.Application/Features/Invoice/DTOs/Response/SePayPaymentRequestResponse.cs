namespace PetOmiPlatform.Application.Features.Invoice.DTOs.Response
{
    public class SePayPaymentRequestResponse
    {
        public Guid InvoiceId { get; set; }
        public string InvoiceCode { get; set; } = string.Empty;
        public string PaymentReference { get; set; } = string.Empty;
        public decimal FinalAmount { get; set; }
        public string QrCodeUrl { get; set; } = string.Empty;
        public string BankAccountNo { get; set; } = string.Empty;
        public string BankCode { get; set; } = string.Empty;
    }
}
