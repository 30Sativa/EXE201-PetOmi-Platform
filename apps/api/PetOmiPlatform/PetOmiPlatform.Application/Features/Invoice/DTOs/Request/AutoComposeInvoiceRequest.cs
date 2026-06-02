namespace PetOmiPlatform.Application.Features.Invoice.DTOs.Request
{
    public class AutoComposeInvoiceRequest
    {
        public Guid? AppointmentId { get; set; }
        public Guid? OrderId { get; set; }
        public Guid? ExaminationId { get; set; }
        public decimal DiscountAmount { get; set; } = 0;
        public string? Notes { get; set; }
        public bool IncludeService { get; set; } = true;
        public bool IncludePrescriptions { get; set; } = true;
        public bool IncludeOrderItems { get; set; } = true;
    }
}
