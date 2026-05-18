using System;

namespace PetOmiPlatform.Application.Features.Pet.DTOs.Request
{
    public class CreatePetWeightLogRequest
    {
        public decimal WeightKg { get; set; }
        public DateTime MeasuredAt { get; set; }
        public string? Source { get; set; }
        public string? Note { get; set; }
    }
}
