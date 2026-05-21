namespace PetOmiPlatform.Application.Features.Appointment.DTOs.Request
{
    /// <summary>Owner đặt lịch hẹn online.</summary>
    public class BookAppointmentRequest
    {
        public Guid ClinicId { get; set; }
        public Guid PetId { get; set; }
        public Guid? ServiceId { get; set; }        // optional — nếu không chọn thì mặc định 30 phút
        public DateOnly AppointmentDate { get; set; }
        public TimeOnly StartTime { get; set; }
        public string AppointmentType { get; set; } = "Checkup";
        public string? Notes { get; set; }
    }
}
