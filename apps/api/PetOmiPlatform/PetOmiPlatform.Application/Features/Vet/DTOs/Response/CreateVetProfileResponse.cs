using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Features.Vet.DTOs.Response
{
    public class CreateVetProfileResponse
    {
        public Guid VetProfileId { get; set; }
        public Guid UserId { get; set; }
        public string? LicenseNumber { get; set; } = null;
        public string? Specialization { get; set; } = null;
    }
}
