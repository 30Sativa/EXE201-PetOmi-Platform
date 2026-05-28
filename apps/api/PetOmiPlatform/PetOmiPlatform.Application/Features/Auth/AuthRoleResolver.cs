using PetOmiPlatform.Domain.Common.Constants;
using System.Collections.Generic;
using System.Linq;

namespace PetOmiPlatform.Application.Features.Auth
{
    public static class AuthRoleResolver
    {
        public static string ResolveDefaultActiveRole(IReadOnlyCollection<string> roles)
        {
            var roleSet = roles
                .Where(r => !string.IsNullOrWhiteSpace(r))
                .ToHashSet(System.StringComparer.OrdinalIgnoreCase);

            // Admin should win over Owner when an account has multiple roles.
            if (roleSet.Contains(RoleConstants.Admin))
                return RoleConstants.Admin;

            if (roleSet.Contains(RoleConstants.Owner))
                return RoleConstants.Owner;

            // Vet mode needs an activeClinicId, so login should not default there blindly.
            if (roleSet.Contains(RoleConstants.Vet))
                return RoleConstants.Owner;

            return RoleConstants.Owner;
        }
    }
}
