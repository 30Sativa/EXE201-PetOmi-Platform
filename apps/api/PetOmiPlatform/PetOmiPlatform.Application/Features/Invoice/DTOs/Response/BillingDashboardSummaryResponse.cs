namespace PetOmiPlatform.Application.Features.Invoice.DTOs.Response
{
    public class BillingDashboardSummaryResponse
    {
        public int UnpaidInvoiceCount { get; set; }
        public decimal TotalUnpaidAmount { get; set; }
        public int PendingReconciliationCount { get; set; }
    }
}
