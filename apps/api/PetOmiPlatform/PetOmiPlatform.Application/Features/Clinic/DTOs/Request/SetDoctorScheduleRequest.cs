namespace PetOmiPlatform.Application.Features.Clinic.DTOs.Request
{
    public class SetDoctorScheduleRequest
    {
        /// <summary>0=CN, 1=T2, 2=T3, 3=T4, 4=T5, 5=T6, 6=T7</summary>
        public int DayOfWeek { get; set; }
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
    }
}
