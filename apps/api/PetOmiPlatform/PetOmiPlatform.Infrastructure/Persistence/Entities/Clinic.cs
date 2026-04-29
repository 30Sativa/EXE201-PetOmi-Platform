using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class Clinic
{
    public Guid ClinicId { get; set; }

    public string ClinicName { get; set; } = null!;

    public string? Address { get; set; }

    public string? Phone { get; set; }

    public string? Email { get; set; }

    public string? LicenseNumber { get; set; }

    public string Status { get; set; } = null!;

    public string? RejectedReason { get; set; }

    public Guid? ReviewedByAdminId { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual User? ReviewedByAdmin { get; set; }

    public virtual ICollection<VetClinic> VetClinics { get; set; } = new List<VetClinic>();
}
