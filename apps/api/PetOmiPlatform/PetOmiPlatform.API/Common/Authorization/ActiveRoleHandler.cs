using Microsoft.AspNetCore.Authorization;

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

            if (string.IsNullOrEmpty(activeRole))
                return Task.CompletedTask;

            if (activeRole == requirement.RequiredRole)
                context.Succeed(requirement);

            return Task.CompletedTask;
        }
    }
}
