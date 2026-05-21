namespace PetOmiPlatform.Application.Features.Clinic.DTOs.Response
{
    public class GetMyClinicResponse
    {
        public Guid ClinicId { get; set; }
        public string ClinicName { get; set; } = null!;
        public string? Address { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? LicenseNumber { get; set; }
        public string? LicenseImageUrl { get; set; }
        public string Status { get; set; } = null!;          // Pending | Approved | Rejected
        public string? RejectedReason { get; set; }          // Lý do từ chối (nếu Rejected)
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
