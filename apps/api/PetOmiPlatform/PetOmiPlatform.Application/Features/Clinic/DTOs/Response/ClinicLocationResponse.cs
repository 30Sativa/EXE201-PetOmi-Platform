namespace PetOmiPlatform.Application.Features.Clinic.DTOs.Response;

public class ClinicLocationResponse
{
    public Guid ClinicId { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public int AppointmentBufferMins { get; set; }
}
