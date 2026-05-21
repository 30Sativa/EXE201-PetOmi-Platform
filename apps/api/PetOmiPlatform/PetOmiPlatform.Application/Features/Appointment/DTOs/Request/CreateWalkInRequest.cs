namespace PetOmiPlatform.Application.Features.Appointment.DTOs.Request
{
    /// <summary>Clinic staff tạo walk-in ngay tại quầy.</summary>
    public class CreateWalkInRequest
    {
        public Guid ClinicId { get; set; }
        public Guid PetId { get; set; }
        public Guid? VetClinicId { get; set; }      // bác sĩ phụ trách (optional lúc tạo)
        public Guid? ServiceId { get; set; }
        public DateOnly AppointmentDate { get; set; }
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }        // staff tự nhập vì biết bác sĩ trực tiếp
        public string AppointmentType { get; set; } = "Checkup";
        public string? Notes { get; set; }
    }
}
