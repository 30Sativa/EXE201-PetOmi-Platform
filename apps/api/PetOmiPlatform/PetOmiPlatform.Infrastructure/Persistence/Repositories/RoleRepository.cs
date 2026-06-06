using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories;

public class RoleRepository : IRoleRepository
{
    private readonly PetOmniDbContext _context;

    public RoleRepository(PetOmniDbContext context)
    {
        _context = context;
    }

    public async Task<RoleOverviewData> GetRoleOverviewAsync()
    {
        var globalRoles = await _context.Roles
            .AsNoTracking()
            .OrderBy(role => role.RoleName)
            .Select(role => new RoleOverviewItem
            {
                RoleId = role.RoleId,
                RoleName = role.RoleName,
                AssignedCount = role.UserRoles.Count()
            })
            .ToListAsync();

        var globalPermissionRows = await _context.RolePermissions
            .AsNoTracking()
            .OrderBy(rolePermission => rolePermission.Permission.PermissionName)
            .Select(rolePermission => new
            {
                rolePermission.RoleId,
                rolePermission.Permission.PermissionId,
                rolePermission.Permission.PermissionName,
                rolePermission.Permission.Description
            })
            .ToListAsync();

        var globalPermissionsByRole = globalPermissionRows
            .GroupBy(item => item.RoleId)
            .ToDictionary(
                group => group.Key,
                group => group
                    .Select(item => new RolePermissionOverviewItem
                    {
                        PermissionId = item.PermissionId,
                        PermissionName = item.PermissionName,
                        Description = item.Description
                    })
                    .ToList());

        foreach (var role in globalRoles)
        {
            if (globalPermissionsByRole.TryGetValue(role.RoleId, out var permissions))
            {
                role.Permissions = permissions;
            }
        }

        var clinicRoles = await _context.VetClinicRoles
            .AsNoTracking()
            .OrderBy(role => role.RoleName)
            .Select(role => new RoleOverviewItem
            {
                RoleId = role.RoleId,
                RoleName = role.RoleName,
                AssignedCount = role.VetClinics.Count(staff => staff.IsActive)
            })
            .ToListAsync();

        var clinicPermissionRows = await _context.VetClinicRolePermissions
            .AsNoTracking()
            .OrderBy(rolePermission => rolePermission.Permission.PermissionName)
            .Select(rolePermission => new
            {
                rolePermission.RoleId,
                rolePermission.Permission.PermissionId,
                rolePermission.Permission.PermissionName,
                rolePermission.Permission.Description
            })
            .ToListAsync();

        var clinicPermissionsByRole = clinicPermissionRows
            .GroupBy(item => item.RoleId)
            .ToDictionary(
                group => group.Key,
                group => group
                    .Select(item => new RolePermissionOverviewItem
                    {
                        PermissionId = item.PermissionId,
                        PermissionName = item.PermissionName,
                        Description = item.Description
                    })
                    .ToList());

        foreach (var role in clinicRoles)
        {
            if (clinicPermissionsByRole.TryGetValue(role.RoleId, out var permissions))
            {
                role.Permissions = permissions;
            }
        }

        return new RoleOverviewData
        {
            GlobalRoles = globalRoles,
            ClinicRoles = clinicRoles,
            TotalPermissions = await _context.Permissions.AsNoTracking().CountAsync(),
            AssignedGlobalUsers = await _context.UserRoles.AsNoTracking().CountAsync(),
            AssignedClinicStaff = await _context.VetClinics.AsNoTracking().CountAsync(staff => staff.IsActive)
        };
    }
}
