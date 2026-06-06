namespace PetOmiPlatform.Application.Features.Admin.DTOs.Response;

public class AdminRolesResponse
{
    public AdminRoleStatsResponse Stats { get; set; } = new();
    public List<AdminRoleItemResponse> GlobalRoles { get; set; } = new();
    public List<AdminRoleItemResponse> ClinicRoles { get; set; } = new();
}

public class AdminRoleStatsResponse
{
    public int GlobalRoleCount { get; set; }
    public int ClinicRoleCount { get; set; }
    public int TotalPermissions { get; set; }
    public int AssignedGlobalUsers { get; set; }
    public int AssignedClinicStaff { get; set; }
}

public class AdminRoleItemResponse
{
    public Guid RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public string Scope { get; set; } = string.Empty;
    public int AssignedCount { get; set; }
    public List<AdminPermissionItemResponse> Permissions { get; set; } = new();
}

public class AdminPermissionItemResponse
{
    public Guid PermissionId { get; set; }
    public string PermissionName { get; set; } = string.Empty;
    public string? Description { get; set; }
}
