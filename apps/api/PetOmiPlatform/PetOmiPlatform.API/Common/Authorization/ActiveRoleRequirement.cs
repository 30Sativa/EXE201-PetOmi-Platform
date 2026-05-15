using Microsoft.AspNetCore.Authorization;

namespace PetOmiPlatform.API.Common.Authorization
{
    public class ActiveRoleRequirement : IAuthorizationRequirement
    {
        public string RequiredRole { get; }

        public ActiveRoleRequirement(string requiredRole)
        {
            RequiredRole = requiredRole;
        }
    }
}
