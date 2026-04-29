using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class VetClinicRole
{
    public Guid RoleId { get; set; }

    public string RoleName { get; set; } = null!;

    public virtual ICollection<VetClinicRolePermission> VetClinicRolePermissions { get; set; } = new List<VetClinicRolePermission>();

    public virtual ICollection<VetClinic> VetClinics { get; set; } = new List<VetClinic>();
}
