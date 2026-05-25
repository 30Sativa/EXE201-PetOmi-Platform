namespace PetOmiPlatform.Application.Features.Appointment.DTOs.Request
{
    public class CreateEmergencyRequest
    {
        public Guid ClinicId { get; set; }
        public Guid PetId { get; set; }
        public Guid? VetClinicId { get; set; }
        public Guid? ServiceId { get; set; }
        public DateOnly AppointmentDate { get; set; }
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
        public string? Notes { get; set; }
        public bool ForceConflictOverride { get; set; } = false;
    }
}
