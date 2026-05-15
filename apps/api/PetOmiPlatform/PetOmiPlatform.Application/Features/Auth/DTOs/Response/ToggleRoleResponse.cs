using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Features.Auth.DTOs.Response
{
    public class ToggleRoleResponse
    {
        public string AccessToken { get; set; } = null!;
        public string ActiveRole { get; set; } = null!;
        public Guid? ActiveClinicId { get; set; }
    }
}
