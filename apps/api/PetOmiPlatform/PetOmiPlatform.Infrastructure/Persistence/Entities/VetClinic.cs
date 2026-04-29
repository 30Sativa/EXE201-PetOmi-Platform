using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class VetClinic
{
    public Guid VetClinicId { get; set; }

    public Guid VetProfileId { get; set; }

    public Guid ClinicId { get; set; }

    public Guid RoleId { get; set; }

    public DateOnly? StartDate { get; set; }

    public DateOnly? EndDate { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Clinic Clinic { get; set; } = null!;

    public virtual VetClinicRole Role { get; set; } = null!;

    public virtual VetProfile VetProfile { get; set; } = null!;
}
