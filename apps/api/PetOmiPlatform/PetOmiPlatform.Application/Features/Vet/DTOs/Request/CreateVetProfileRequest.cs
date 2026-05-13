using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Features.Vet.DTOs.Request
{
    public class CreateVetProfileRequest
    {
        public string? LicenseNumber { get; set; }
        public string? Specialization { get; set; }
    }
}
