namespace PetOmiPlatform.Application.Features.Clinic.DTOs.Response
{
    /// <summary>Profile công khai của clinic — Owner app dùng để hiển thị cho user.</summary>
    public class ClinicPublicResponse
    {
        public Guid ClinicId { get; set; }
        public string ClinicName { get; set; } = null!;
        public string? Address { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? LogoUrl { get; set; }
        public string? Description { get; set; }
        public string? OpeningHours { get; set; }   // JSON string giờ mở cửa
        public List<ClinicServiceResponse> Services { get; set; } = new();
    }
}
