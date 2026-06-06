using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PetOmiPlatform.Domain.Interfaces.Repositories;

public interface IRoleRepository
{
    Task<RoleOverviewData> GetRoleOverviewAsync();
}

public class RoleOverviewData
{
    public List<RoleOverviewItem> GlobalRoles { get; set; } = new();
    public List<RoleOverviewItem> ClinicRoles { get; set; } = new();
    public int TotalPermissions { get; set; }
    public int AssignedGlobalUsers { get; set; }
    public int AssignedClinicStaff { get; set; }
}

public class RoleOverviewItem
{
    public Guid RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public int AssignedCount { get; set; }
    public List<RolePermissionOverviewItem> Permissions { get; set; } = new();
}

public class RolePermissionOverviewItem
{
    public Guid PermissionId { get; set; }
    public string PermissionName { get; set; } = string.Empty;
    public string? Description { get; set; }
}
