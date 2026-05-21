namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class DoctorSchedule
{
    public Guid ScheduleId { get; set; }

    public Guid VetClinicId { get; set; }   // FK → VetClinic

    public int DayOfWeek { get; set; }       // 0=CN ... 6=T7

    public TimeOnly StartTime { get; set; }

    public TimeOnly EndTime { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual VetClinic VetClinic { get; set; } = null!;
}
