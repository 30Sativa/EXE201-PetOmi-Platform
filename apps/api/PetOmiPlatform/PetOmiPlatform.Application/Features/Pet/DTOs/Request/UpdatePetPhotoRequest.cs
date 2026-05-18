using System;

namespace PetOmiPlatform.Application.Features.Pet.DTOs.Request
{
    public class UpdatePetPhotoRequest
    {
        public string? Caption { get; set; }
        public bool? SetAsAvatar { get; set; }
    }
}
