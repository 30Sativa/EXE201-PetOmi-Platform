namespace PetOmiPlatform.Application.Features.Invoice.DTOs.Request
{
    public class ManualMatchSePayTransactionRequest
    {
        public Guid InvoiceId { get; set; }
        public string? ReviewNote { get; set; }
    }
}
