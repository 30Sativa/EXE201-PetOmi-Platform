namespace PetOmiPlatform.Application.Features.Appointment.DTOs.Response
{
    public class GuestWalkInIntakeResponse
    {
        public Guid TemporaryOwnerUserId { get; set; }
        public string TemporaryOwnerEmail { get; set; } = null!;
        public Guid PetId { get; set; }
        public Guid AppointmentId { get; set; }
        public AppointmentResponse Appointment { get; set; } = null!;
    }
}
