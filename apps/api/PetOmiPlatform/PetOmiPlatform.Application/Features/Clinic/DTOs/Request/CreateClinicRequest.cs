namespace PetOmiPlatform.Application.Features.Clinic.DTOs.Request
{
    public class CreateClinicRequest
    {
        public string ClinicName { get; set; } = null!;
        public string? Address { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? LicenseNumber { get; set; }
        public string? LicenseImageUrl { get; set; }
        public string? LicenseCloudinaryPublicId { get; set; }
        public string? LogoUrl { get; set; }
        public string? LogoCloudinaryPublicId { get; set; }
    }
}
