namespace PetOmiPlatform.Application.Features.Clinic.DTOs.Response
{
    public class CreateClinicResponse
    {
        public Guid ClinicId { get; set; }
        public Guid VetProfileId { get; set; }
        public string ClinicName { get; set; } = null!;
        public string? Address { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? LicenseNumber { get; set; }
        public string Status { get; set; } = null!;
    }
}
