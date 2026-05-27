namespace PetOmiPlatform.Application.Features.Invoice.DTOs.Request
{
    public class PayInvoiceRequest
    {
        public string PaymentMethod { get; set; } = "Cash";
        public decimal? PaidAmount { get; set; }
    }
}
