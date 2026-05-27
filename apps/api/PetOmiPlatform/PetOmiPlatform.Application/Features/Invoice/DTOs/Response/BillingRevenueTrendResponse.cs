namespace PetOmiPlatform.Application.Features.Invoice.DTOs.Response
{
    public class BillingRevenueTrendResponse
    {
        public DateOnly FromDate { get; set; }
        public DateOnly ToDate { get; set; }
        public decimal TotalRevenue { get; set; }
        public int TotalPaidInvoiceCount { get; set; }
        public List<BillingRevenueTrendPointResponse> Points { get; set; } = new();
    }
}
