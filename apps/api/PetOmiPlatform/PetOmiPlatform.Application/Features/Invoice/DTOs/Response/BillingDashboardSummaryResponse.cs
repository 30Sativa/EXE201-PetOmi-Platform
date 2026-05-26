namespace PetOmiPlatform.Application.Features.Invoice.DTOs.Response
{
    public class BillingDashboardSummaryResponse
    {
        public int UnpaidInvoiceCount { get; set; }
        public decimal TotalUnpaidAmount { get; set; }
        public int PendingReconciliationCount { get; set; }
        public BillingAgingBucketResponse Aging0To7Days { get; set; } = new();
        public BillingAgingBucketResponse Aging8To30Days { get; set; } = new();
        public BillingAgingBucketResponse Aging31PlusDays { get; set; } = new();
    }
}
