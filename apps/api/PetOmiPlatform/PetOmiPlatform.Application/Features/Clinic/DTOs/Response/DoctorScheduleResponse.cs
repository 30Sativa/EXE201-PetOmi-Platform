namespace PetOmiPlatform.Application.Features.Clinic.DTOs.Response
{
    public class DoctorScheduleResponse
    {
        public Guid ScheduleId { get; set; }
        public Guid VetClinicId { get; set; }
        public int DayOfWeek { get; set; }       // 0=CN ... 6=T7
        public string DayName { get; set; } = null!;  // "Thứ 2", "Thứ 3"...
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
        public bool IsActive { get; set; }
    }
}
