namespace PetOmiPlatform.Application.Features.Invoice.DTOs.Response
{
    public class BillingRevenueTrendResponse
    {
        public DateOnly FromDate { get; set; }
        public DateOnly ToDate { get; set; }
        public decimal TotalRevenue { get; set; }
        public int TotalPaidInvoiceCount { get; set; }
        public decimal TotalCashRevenue { get; set; }
        public int TotalCashInvoiceCount { get; set; }
        public decimal TotalBankTransferRevenue { get; set; }
        public int TotalBankTransferInvoiceCount { get; set; }
        public decimal TotalSePayRevenue { get; set; }
        public int TotalSePayInvoiceCount { get; set; }
        public List<BillingRevenueTrendPointResponse> Points { get; set; } = new();
    }
}
