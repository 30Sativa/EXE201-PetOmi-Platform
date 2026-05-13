namespace PetOmiPlatform.Application.Features.Clinic.DTOs.Response
{
    public class ReviewClinicResponse
    {
        public Guid ClinicId { get; set; }
        public string ClinicName { get; set; } = null!;
        public string Status { get; set; } = null!;
        public string? RejectedReason { get; set; }
        public Guid? ReviewedByAdminId { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
