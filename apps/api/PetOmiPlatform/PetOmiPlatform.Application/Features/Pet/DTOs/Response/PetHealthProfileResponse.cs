using System;

namespace PetOmiPlatform.Application.Features.Pet.DTOs.Response
{
    public class PetHealthProfileResponse
    {
        public Guid PetHealthProfileId { get; set; }
        public Guid PetId { get; set; }
        public decimal? CurrentWeightKg { get; set; }
        public string? Color { get; set; }
        public string? IsNeutered { get; set; }
        public string? Allergies { get; set; }
        public string? ChronicConditions { get; set; }
        public string? MicrochipNumber { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
