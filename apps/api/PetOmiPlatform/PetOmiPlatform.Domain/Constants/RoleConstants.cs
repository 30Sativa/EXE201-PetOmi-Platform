using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Domain.Constants
{
    public static class RoleConstants
    {
        public static readonly Guid OwnerId = Guid.Parse("11111111-0000-0000-0000-000000000001");
        public static readonly Guid AdminId = Guid.Parse("11111111-0000-0000-0000-000000000002");

        public const string Owner = "Owner";
        public const string Admin = "Admin";
        public const string Vet = "Vet";
    }
    public static class ClinicRoleConstants
    {
        public static readonly Guid ClinicOwnerId = Guid.Parse("33333333-0000-0000-0000-000000000001");
        public static readonly Guid PrimaryVetId = Guid.Parse("33333333-0000-0000-0000-000000000002");
        public static readonly Guid AssistantId = Guid.Parse("33333333-0000-0000-0000-000000000003");

    }
}
