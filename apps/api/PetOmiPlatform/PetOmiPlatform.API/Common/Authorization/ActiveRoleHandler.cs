using Microsoft.AspNetCore.Authorization;
using PetOmiPlatform.Domain.Common.Constants;

namespace PetOmiPlatform.API.Common.Authorization
{
    public class ActiveRoleHandler : AuthorizationHandler<ActiveRoleRequirement>
    {
        protected override Task HandleRequirementAsync(
            AuthorizationHandlerContext context,
            ActiveRoleRequirement requirement)
        {
            // Lấy activeRole từ JWT claim
            var activeRole = context.User.FindFirst("activeRole")?.Value;

            // Nếu không có activeRole claim → mặc định là Owner
            // (token cũ generate bằng GenerateToken() không có claim này)
            if (string.IsNullOrEmpty(activeRole))
                activeRole = RoleConstants.Owner;

            if (activeRole == requirement.RequiredRole)
                context.Succeed(requirement);

            return Task.CompletedTask;
        }
    }
}
