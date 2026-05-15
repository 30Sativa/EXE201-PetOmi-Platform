using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Features.Auth.DTOs.Request
{
    public class ToggleRoleRequest
    {
        public string TargetRole { get; set; } = null!;
        public Guid? ClinicId { get; set; }
    }
}
