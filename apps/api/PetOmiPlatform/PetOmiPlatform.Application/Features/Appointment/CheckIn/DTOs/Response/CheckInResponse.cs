namespace PetOmiPlatform.Application.Features.Appointment.CheckIn.DTOs.Response
{
    public class CheckInResponse
    {
        public Guid AppointmentId { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? CheckedInAt { get; set; }
        public Guid? CheckedInByUserId { get; set; }
    }
}
