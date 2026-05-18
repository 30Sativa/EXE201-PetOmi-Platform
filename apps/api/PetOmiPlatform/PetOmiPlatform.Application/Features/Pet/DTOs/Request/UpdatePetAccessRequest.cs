using System;

namespace PetOmiPlatform.Application.Features.Pet.DTOs.Request
{
    public class UpdatePetAccessRequest
    {
        public string AccessRole { get; set; } = null!;
        public DateTime? ExpiresAt { get; set; }
    }
}
