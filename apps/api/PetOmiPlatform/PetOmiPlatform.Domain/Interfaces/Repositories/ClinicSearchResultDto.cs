namespace PetOmiPlatform.Domain.Interfaces.Repositories;

public class ClinicSearchResultDto
{
    public Guid ClinicId { get; set; }
    public string ClinicName { get; set; } = null!;
    public string? Address { get; set; }
    public string? LogoUrl { get; set; }
    public string? Description { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public double? DistanceKm { get; set; }
    public string? OpeningHours { get; set; }
    public int AppointmentBufferMins { get; set; }
}
