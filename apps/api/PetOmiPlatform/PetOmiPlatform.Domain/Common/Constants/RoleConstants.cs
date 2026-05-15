using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Domain.Common.Constants
{
    public static class RoleConstants
    {
        public static readonly Guid OwnerId = Guid.Parse("11111111-0000-0000-0000-000000000001");
        public static readonly Guid AdminId = Guid.Parse("11111111-0000-0000-0000-000000000002");
        public static readonly Guid VetId = Guid.Parse("11111111-0000-0000-0000-000000000003");
        public const string Owner = "Owner";
        public const string Admin = "Admin";
        public const string Vet = "Vet";
    }
    public static class ClinicRoleConstants
    {
        public static readonly Guid ClinicOwnerId = Guid.Parse("33333333-0000-0000-0000-000000000001");
        public static readonly Guid PrimaryVetId = Guid.Parse("33333333-0000-0000-0000-000000000002");
        public static readonly Guid AssistantId = Guid.Parse("33333333-0000-0000-0000-000000000003");
        // String cho validation + mapping
        public const string ClinicOwner = "ClinicOwner";
        public const string PrimaryVet = "PrimaryVet";
        public const string Assistant = "Assistant";

        // Helper: convert string → Guid để lưu DB
        public static Guid ToRoleId(string roleName) => roleName switch
        {
            PrimaryVet => PrimaryVetId,
            Assistant => AssistantId,
            ClinicOwner => ClinicOwnerId,
            _ => throw new ArgumentException($"Role không hợp lệ: {roleName}")
        };
    }
}
