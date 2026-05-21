namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class Appointment
{
    public Guid AppointmentId { get; set; }
    public Guid ClinicId { get; set; }
    public Guid? VetClinicId { get; set; }
    public Guid? ServiceId { get; set; }
    public Guid PetId { get; set; }
    public Guid BookedByUserId { get; set; }

    public DateOnly AppointmentDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }

    public string AppointmentType { get; set; } = "Checkup";
    public string Status { get; set; } = "Pending";

    public string? Notes { get; set; }
    public string? CancellationReason { get; set; }
    public bool IsWalkIn { get; set; }
    public bool IsLateCancellation { get; set; }

    public DateTime? ConfirmedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public Guid? CancelledByUserId { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public virtual Clinic Clinic { get; set; } = null!;
    public virtual VetClinic? VetClinic { get; set; }
    public virtual ClinicService? Service { get; set; }
    public virtual Pet Pet { get; set; } = null!;
    public virtual User BookedByUser { get; set; } = null!;
    public virtual User? CancelledByUser { get; set; }
}
