namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class MedicalExamination
{
    public Guid ExaminationId { get; set; }
    public Guid AppointmentId { get; set; }
    public Guid PetId { get; set; }
    public Guid? VetClinicId { get; set; }

    public string ChiefComplaint { get; set; } = string.Empty;

    public decimal? WeightKg { get; set; }
    public decimal? TemperatureC { get; set; }
    public int? HeartRate { get; set; }
    public int? RespiratoryRate { get; set; }
    public string? ExaminationNotes { get; set; }

    public string? Diagnosis { get; set; }
    public string? TreatmentPlan { get; set; }

    public string Status { get; set; } = "InProgress";

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    // Navigation properties
    public virtual Appointment Appointment { get; set; } = null!;
    public virtual Pet Pet { get; set; } = null!;
    public virtual VetClinic? VetClinic { get; set; }
    public virtual ICollection<Prescription> Prescriptions { get; set; } = new List<Prescription>();
}
