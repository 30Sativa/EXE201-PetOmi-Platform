using System;

namespace PetOmiPlatform.Application.Features.Pet.DTOs.Request
{
    public class UpdatePetRequest
    {
        public string? Name { get; set; }
        public string? Species { get; set; }
        public string? Breed { get; set; }
        public string? Gender { get; set; }
        public string? IsNeutered { get; set; }
        public DateOnly? DateOfBirth { get; set; }
        public bool? IsBirthDateEstimated { get; set; }
        public string? AvatarUrl { get; set; }
        public string? Color { get; set; }
    }
}
