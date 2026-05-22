namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class Invoice
{
    public Guid InvoiceId { get; set; }
    public Guid AppointmentId { get; set; }
    public Guid? ExaminationId { get; set; }
    public Guid ClinicId { get; set; }

    public decimal TotalAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal FinalAmount { get; set; }

    public string Status { get; set; } = "Unpaid";
    public string? PaymentMethod { get; set; }
    public string? Notes { get; set; }

    public DateTime? PaidAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual Appointment Appointment { get; set; } = null!;
    public virtual MedicalExamination? Examination { get; set; }
    public virtual Clinic Clinic { get; set; } = null!;
    public virtual ICollection<InvoiceItem> InvoiceItems { get; set; } = new List<InvoiceItem>();
}
