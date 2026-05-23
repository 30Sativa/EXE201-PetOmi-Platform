using System;

namespace PetOmiPlatform.Application.Features.Pet.DTOs.Request
{
    public class GrantPetAccessRequest
    {
        /// <summary>
        /// Email của người được mời chia sẻ.
        /// </summary>
        public string UserEmail { get; set; } = null!;
        public string AccessRole { get; set; } = null!;
        public DateTime? ExpiresAt { get; set; }
    }
}
