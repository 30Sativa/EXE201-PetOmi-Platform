namespace PetOmiPlatform.Application.Features.Appointment.DTOs.Request
{
    public class RescheduleAppointmentRequest
    {
        public DateOnly NewDate { get; set; }
        public TimeOnly NewStartTime { get; set; }
        public TimeOnly NewEndTime { get; set; }
    }
}
