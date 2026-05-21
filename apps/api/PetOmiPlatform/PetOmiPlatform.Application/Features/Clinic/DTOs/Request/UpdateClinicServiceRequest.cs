namespace PetOmiPlatform.Application.Features.Clinic.DTOs.Request
{
    public class UpdateClinicServiceRequest
    {
        public string? ServiceName { get; set; }
        public string? Description { get; set; }
        public decimal? Price { get; set; }
        public int? DurationMins { get; set; }
    }
}
