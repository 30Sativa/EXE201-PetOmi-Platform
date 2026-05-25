namespace PetOmiPlatform.Application.Features.Clinic.DTOs.Response
{
    /// <summary>Item trong danh sách clinic — Admin xem để duyệt.</summary>
    public class ClinicListItemResponse
    {
        public Guid ClinicId { get; set; }
        public string ClinicName { get; set; } = null!;
        public string? Address { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? LicenseNumber { get; set; }
        public string? LicenseImageUrl { get; set; }     // Admin click xem ảnh GKPD
        public string? LicenseCloudinaryPublicId { get; set; }
        public string Status { get; set; } = null!;
        public string? RejectedReason { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
