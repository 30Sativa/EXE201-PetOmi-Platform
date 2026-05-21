namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class ClinicService
{
    public Guid ServiceId { get; set; }

    public Guid ClinicId { get; set; }

    public string ServiceName { get; set; } = null!;

    public string? Description { get; set; }

    public decimal Price { get; set; }

    public int DurationMins { get; set; }   // Dùng để tính available slots

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Clinic Clinic { get; set; } = null!;
}
