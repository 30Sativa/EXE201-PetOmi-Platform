using System;

namespace PetOmiPlatform.Application.Features.Pet.DTOs.Request
{
    public class GrantPetAccessRequest
    {
        public Guid UserId { get; set; }
        public string AccessRole { get; set; } = null!;
        public DateTime? ExpiresAt { get; set; }
    }
}
