namespace PetOmiPlatform.Domain.Common.Models;

public class ClinicPetSearchResult
{
    public Guid PetId { get; set; }
    public Guid OwnerUserId { get; set; }
    public string? PublicPetCode { get; set; }
    public string PetName { get; set; } = string.Empty;
    public string Species { get; set; } = string.Empty;
    public string? Breed { get; set; }
    public string? Gender { get; set; }
    public string? AvatarUrl { get; set; }
    public string OwnerEmail { get; set; } = string.Empty;
    public string? OwnerFullName { get; set; }
    public string? OwnerPhone { get; set; }
    public DateOnly? LastAppointmentDate { get; set; }
    public string? LastAppointmentStatus { get; set; }
}
