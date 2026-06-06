using MediatR;
using PetOmiPlatform.Application.Features.Admin.DTOs.Response;
using PetOmiPlatform.Application.Features.Admin.Queries;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Admin.Handler;

public class GetAdminRolesQueryHandler : IRequestHandler<GetAdminRolesQuery, AdminRolesResponse>
{
    private readonly IRoleRepository _roleRepository;

    public GetAdminRolesQueryHandler(IRoleRepository roleRepository)
    {
        _roleRepository = roleRepository;
    }

    public async Task<AdminRolesResponse> Handle(GetAdminRolesQuery request, CancellationToken cancellationToken)
    {
        var overview = await _roleRepository.GetRoleOverviewAsync();

        return new AdminRolesResponse
        {
            Stats = new AdminRoleStatsResponse
            {
                GlobalRoleCount = overview.GlobalRoles.Count,
                ClinicRoleCount = overview.ClinicRoles.Count,
                TotalPermissions = overview.TotalPermissions,
                AssignedGlobalUsers = overview.AssignedGlobalUsers,
                AssignedClinicStaff = overview.AssignedClinicStaff
            },
            GlobalRoles = overview.GlobalRoles
                .Select(role => MapRole(role, "global"))
                .ToList(),
            ClinicRoles = overview.ClinicRoles
                .Select(role => MapRole(role, "clinic"))
                .ToList()
        };
    }

    private static AdminRoleItemResponse MapRole(RoleOverviewItem role, string scope)
    {
        return new AdminRoleItemResponse
        {
            RoleId = role.RoleId,
            RoleName = role.RoleName,
            Scope = scope,
            AssignedCount = role.AssignedCount,
            Permissions = role.Permissions
                .Select(permission => new AdminPermissionItemResponse
                {
                    PermissionId = permission.PermissionId,
                    PermissionName = permission.PermissionName,
                    Description = permission.Description
                })
                .ToList()
        };
    }
}
