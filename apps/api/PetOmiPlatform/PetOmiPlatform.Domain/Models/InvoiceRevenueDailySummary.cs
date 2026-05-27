namespace PetOmiPlatform.Domain.Models
{
    public class InvoiceRevenueDailySummary
    {
        public DateOnly Date { get; set; }
        public decimal Revenue { get; set; }
        public int PaidInvoiceCount { get; set; }
    }
}
