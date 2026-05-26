namespace PetOmiPlatform.Domain.Models
{
    public class InvoiceAgingBucketSummary
    {
        public int Count0To7Days { get; set; }
        public decimal Amount0To7Days { get; set; }
        public int Count8To30Days { get; set; }
        public decimal Amount8To30Days { get; set; }
        public int Count31PlusDays { get; set; }
        public decimal Amount31PlusDays { get; set; }
    }
}
