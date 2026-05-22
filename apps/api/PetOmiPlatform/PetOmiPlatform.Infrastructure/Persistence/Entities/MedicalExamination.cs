using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class MedicalExamination
{
    public Guid ExaminationId { get; set; }

    public Guid AppointmentId { get; set; }

    public Guid PetId { get; set; }

    public Guid? VetClinicId { get; set; }

    public string ChiefComplaint { get; set; } = null!;

    public decimal? WeightKg { get; set; }

    public decimal? TemperatureC { get; set; }

    public int? HeartRate { get; set; }

    public int? RespiratoryRate { get; set; }

    public string? ExaminationNotes { get; set; }

    public string? Diagnosis { get; set; }

    public string? TreatmentPlan { get; set; }

    public string Status { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public virtual Appointment Appointment { get; set; } = null!;

    public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();

    public virtual Pet Pet { get; set; } = null!;

    public virtual ICollection<Prescription> Prescriptions { get; set; } = new List<Prescription>();

    public virtual VetClinic? VetClinic { get; set; }
}
