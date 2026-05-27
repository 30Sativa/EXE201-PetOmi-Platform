namespace PetOmiPlatform.Domain.Models
{
    public class InvoiceRevenueDailySummary
    {
        public DateOnly Date { get; set; }
        public decimal Revenue { get; set; }
        public int PaidInvoiceCount { get; set; }
        public decimal CashRevenue { get; set; }
        public int CashInvoiceCount { get; set; }
        public decimal BankTransferRevenue { get; set; }
        public int BankTransferInvoiceCount { get; set; }
        public decimal SePayRevenue { get; set; }
        public int SePayInvoiceCount { get; set; }
    }
}
