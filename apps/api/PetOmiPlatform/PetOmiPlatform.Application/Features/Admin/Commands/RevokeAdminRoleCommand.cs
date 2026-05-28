using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.Admin.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Admin.Commands;

public record RevokeAdminRoleCommand(
    Guid AdminId,
    Guid TargetUserId
) : IRequest<AdminUserListResponse>, IAuditableCommand
{
    public Guid? UserId => AdminId;
    public string Action => "RevokeAdminRole";
    public string Category => "Role";
}
