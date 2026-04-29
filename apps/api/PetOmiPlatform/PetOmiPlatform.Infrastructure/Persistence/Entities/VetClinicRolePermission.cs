using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public partial class VetClinicRolePermission
{
    public Guid Id { get; set; }

    public Guid RoleId { get; set; }

    public Guid PermissionId { get; set; }

    public virtual Permission Permission { get; set; } = null!;

    public virtual VetClinicRole Role { get; set; } = null!;
}
