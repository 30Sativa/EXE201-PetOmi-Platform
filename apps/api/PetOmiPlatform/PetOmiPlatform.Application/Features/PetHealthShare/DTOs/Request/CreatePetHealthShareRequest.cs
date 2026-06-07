using System;

namespace PetOmiPlatform.Application.Features.PetHealthShare.DTOs.Request
{
    public class CreatePetHealthShareRequest
    {
        public string Scope { get; set; } = "ClinicVisit";

        public string AccessMode { get; set; } = "Temporary";

        public DateTime? ExpiresAt { get; set; }

        public int? MaxUses { get; set; }

        public Guid? ClinicId { get; set; }

        public string? Note { get; set; }
    }
}
