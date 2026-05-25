namespace PetOmiPlatform.Application.Features.Clinic.DTOs.Request
{
    public class ResubmitClinicRequest
    {
        public string? LicenseNumber { get; set; }     // Số GKPD mới (nếu muốn đổi)
        public string? LicenseImageUrl { get; set; }   // Ảnh GKPD mới (nếu upload lại)
        public string? LicenseCloudinaryPublicId { get; set; } // PublicId ảnh GKPD mới
    }
}
