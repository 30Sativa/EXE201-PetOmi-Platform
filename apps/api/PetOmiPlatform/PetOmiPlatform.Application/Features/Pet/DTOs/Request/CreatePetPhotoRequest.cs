using System;

namespace PetOmiPlatform.Application.Features.Pet.DTOs.Request
{
    public class CreatePetPhotoRequest
    {
        public string ImageUrl { get; set; } = null!;
        public string? CloudinaryPublicId { get; set; }
        public string? Caption { get; set; }
        public bool IsAvatar { get; set; }
        public DateTime? TakenAt { get; set; }
    }
}
