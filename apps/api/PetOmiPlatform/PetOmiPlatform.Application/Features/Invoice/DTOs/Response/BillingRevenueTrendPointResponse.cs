namespace PetOmiPlatform.Application.Features.Invoice.DTOs.Response
{
    public class BillingRevenueTrendPointResponse
    {
        public DateOnly Date { get; set; }
        public decimal Revenue { get; set; }
        public int PaidInvoiceCount { get; set; }
    }
}
