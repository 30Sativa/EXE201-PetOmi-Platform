namespace PetOmiPlatform.Application.Features.Appointment.DTOs.Request
{
    public class RejectAppointmentRequest
    {
        public string Reason { get; set; } = string.Empty;
    }

    public class CancelAppointmentRequest
    {
        public string? Reason { get; set; }
    }

    public class RescheduleAppointmentRequest
    {
        public DateOnly NewDate { get; set; }
        public TimeOnly NewStartTime { get; set; }
        public TimeOnly NewEndTime { get; set; }
    }
}
