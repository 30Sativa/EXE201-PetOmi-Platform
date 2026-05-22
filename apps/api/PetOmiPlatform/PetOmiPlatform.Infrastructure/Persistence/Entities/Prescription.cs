namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class Prescription
{
    public Guid PrescriptionId { get; set; }
    public Guid ExaminationId { get; set; }

    public string MedicationName { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public int DurationDays { get; set; }
    public string? Instructions { get; set; }
    public Guid? InventoryItemId { get; set; }

    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public virtual MedicalExamination Examination { get; set; } = null!;
    public virtual InventoryItem? InventoryItem { get; set; }
}
