namespace PetOmiPlatform.Application.Features.Clinic.DTOs.Response
{
    public class ClinicDoctorListItemResponse
    {
        public Guid VetClinicId { get; set; }
        public Guid VetProfileId { get; set; }
        public Guid UserId { get; set; }
        public string FullName { get; set; } = null!;
        public string? AvatarUrl { get; set; }
        public string? Specialization { get; set; }
        public string RoleName { get; set; } = null!;
    }
}
