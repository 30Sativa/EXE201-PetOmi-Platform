namespace PetOmiPlatform.Application.Features.Clinic.DTOs.Request
{
    /// <summary>ClinicOwner cập nhật thông tin phòng khám (chỉ khi Approved).</summary>
    public class UpdateClinicInfoRequest
    {
        public string? ClinicName { get; set; }
        public string? Address { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? LogoUrl { get; set; }        // URL ảnh logo (đã upload lên storage)
        public string? Description { get; set; }
        public string? OpeningHours { get; set; }   // JSON string: {"Mon-Fri":"08:00-17:00"}
    }
}
