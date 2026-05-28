using MediatR;
using PetOmiPlatform.Application.Common.Interfaces;
using PetOmiPlatform.Application.Features.Admin.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Admin.Commands;

public record ToggleUserStatusCommand(
    Guid AdminId,
    Guid TargetUserId,
    bool IsActive
) : IRequest<AdminUserListResponse>, IAuditableCommand
{
    public Guid? UserId => AdminId;
    public string Action => IsActive ? "ActivateUser" : "DeactivateUser";
    public string Category => "User";
}
