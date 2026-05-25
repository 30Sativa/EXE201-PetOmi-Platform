using System;

namespace PetOmiPlatform.Application.Features.Pet.DTOs.Response
{
    public class PetPhotoResponse
    {
        public Guid PhotoId { get; set; }
        public Guid PetId { get; set; }
        public string ImageUrl { get; set; } = null!;
        public string? CloudinaryPublicId { get; set; }
        public string? Caption { get; set; }
        public bool IsAvatar { get; set; }
        public DateTime? TakenAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
