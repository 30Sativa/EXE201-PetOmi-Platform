using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class Permission
{
    public Guid PermissionId { get; set; }

    public string PermissionName { get; set; } = null!;

    public string? Description { get; set; }

    public virtual ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();

    public virtual ICollection<VetClinicRolePermission> VetClinicRolePermissions { get; set; } = new List<VetClinicRolePermission>();
}
