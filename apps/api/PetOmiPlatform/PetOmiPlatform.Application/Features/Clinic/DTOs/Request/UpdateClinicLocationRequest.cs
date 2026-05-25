namespace PetOmiPlatform.Application.Features.Clinic.DTOs.Request;

public class UpdateClinicLocationRequest
{
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public int? AppointmentBufferMins { get; set; }
}
