using System;

namespace PetOmiPlatform.Application.Features.Pet.DTOs.Request
{
    public class CreatePetHealthProfileRequest
    {
        public decimal? CurrentWeightKg { get; set; }
        public string? Color { get; set; }
        public string? IsNeutered { get; set; }
        public string? Allergies { get; set; }
        public string? ChronicConditions { get; set; }
        public string? MicrochipNumber { get; set; }
    }
}
