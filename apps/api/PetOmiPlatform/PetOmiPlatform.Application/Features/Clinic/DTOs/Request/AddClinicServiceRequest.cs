namespace PetOmiPlatform.Application.Features.Clinic.DTOs.Request
{
    public class AddClinicServiceRequest
    {
        public string ServiceName { get; set; } = null!;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public int DurationMins { get; set; } = 30;  // Default 30 phút
    }
}
