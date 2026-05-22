using PetOmiPlatform.Domain.Entities;

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

        private static readonly string[] DayNames =
            { "Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7" };

        public static DoctorScheduleResponse FromDomain(DoctorScheduleDomain schedule)
            => new()
            {
                ScheduleId = schedule.Id,
                VetClinicId = schedule.VetClinicId,
                DayOfWeek = schedule.DayOfWeek,
                DayName = DayNames[schedule.DayOfWeek],
                StartTime = schedule.StartTime,
                EndTime = schedule.EndTime,
                IsActive = schedule.IsActive
            };
    }
}
