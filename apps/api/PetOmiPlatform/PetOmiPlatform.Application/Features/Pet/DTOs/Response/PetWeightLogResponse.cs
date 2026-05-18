using System;

namespace PetOmiPlatform.Application.Features.Pet.DTOs.Response
{
    public class PetWeightLogResponse
    {
        public Guid WeightLogId { get; set; }
        public Guid PetId { get; set; }
        public decimal WeightKg { get; set; }
        public DateTime MeasuredAt { get; set; }
        public string? Source { get; set; }
        public string? Note { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
