namespace PetOmiPlatform.Application.Features.Invoice.DTOs.Response
{
    public class BillingRevenueTrendResponse
    {
        public DateOnly FromDate { get; set; }
        public DateOnly ToDate { get; set; }
        public DateOnly PreviousFromDate { get; set; }
        public DateOnly PreviousToDate { get; set; }
        public decimal TotalRevenue { get; set; }
        public int TotalPaidInvoiceCount { get; set; }
        public decimal PreviousTotalRevenue { get; set; }
        public int PreviousTotalPaidInvoiceCount { get; set; }
        public decimal? RevenueChangePercent { get; set; }
        public decimal? PaidInvoiceCountChangePercent { get; set; }
        public decimal TotalCashRevenue { get; set; }
        public int TotalCashInvoiceCount { get; set; }
        public decimal TotalBankTransferRevenue { get; set; }
        public int TotalBankTransferInvoiceCount { get; set; }
        public decimal TotalSePayRevenue { get; set; }
        public int TotalSePayInvoiceCount { get; set; }
        public List<BillingRevenueTrendPointResponse> Points { get; set; } = new();
    }
}
