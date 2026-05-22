using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class Prescription
{
    public Guid PrescriptionId { get; set; }

    public Guid ExaminationId { get; set; }

    public string MedicationName { get; set; } = null!;

    public string Dosage { get; set; } = null!;

    public string Frequency { get; set; } = null!;

    public int DurationDays { get; set; }

    public string? Instructions { get; set; }

    public Guid? InventoryItemId { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual MedicalExamination Examination { get; set; } = null!;

    public virtual Inventory? InventoryItem { get; set; }
}
