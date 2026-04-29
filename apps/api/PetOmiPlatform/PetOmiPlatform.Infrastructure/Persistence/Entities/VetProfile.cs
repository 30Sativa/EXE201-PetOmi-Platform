using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class VetProfile
{
    public Guid VetProfileId { get; set; }

    public Guid UserId { get; set; }

    public string? LicenseNumber { get; set; }

    public string? Specialization { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual User User { get; set; } = null!;

    public virtual ICollection<VetClinic> VetClinics { get; set; } = new List<VetClinic>();
}
