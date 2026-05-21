namespace PetOmiPlatform.Application.Features.Clinic.DTOs.Response
{
    public class ClinicServiceResponse
    {
        public Guid ServiceId { get; set; }
        public string ServiceName { get; set; } = null!;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public int DurationMins { get; set; }
        public bool IsActive { get; set; }
    }
}
