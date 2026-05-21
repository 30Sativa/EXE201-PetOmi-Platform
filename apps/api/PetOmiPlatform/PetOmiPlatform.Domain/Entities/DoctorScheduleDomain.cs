using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Exceptions;

namespace PetOmiPlatform.Domain.Entities
{
    /// <summary>
    /// Lịch làm việc tuần của một bác sĩ tại một phòng khám.
    /// Mỗi record = 1 ca làm trong tuần (DayOfWeek + khung giờ).
    /// </summary>
    public class DoctorScheduleDomain : BaseEntity
    {
        public Guid VetClinicId { get; private set; }   // Link đến VetClinic (bác sĩ tại PK cụ thể)
        public int DayOfWeek { get; private set; }       // 0=Sunday ... 6=Saturday (DayOfWeek enum)
        public TimeOnly StartTime { get; private set; }
        public TimeOnly EndTime { get; private set; }
        public bool IsActive { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public DateTime? UpdatedAt { get; private set; }

        private DoctorScheduleDomain() { }

        private DoctorScheduleDomain(Guid vetClinicId, int dayOfWeek, TimeOnly startTime, TimeOnly endTime)
        {
            Id = Guid.NewGuid();
            VetClinicId = vetClinicId;
            DayOfWeek = dayOfWeek;
            StartTime = startTime;
            EndTime = endTime;
            IsActive = true;
            CreatedAt = DateTime.UtcNow;
        }

        public static DoctorScheduleDomain Reconstitute(
            Guid id, Guid vetClinicId, int dayOfWeek,
            TimeOnly startTime, TimeOnly endTime,
            bool isActive, DateTime createdAt, DateTime? updatedAt)
        {
            return new DoctorScheduleDomain
            {
                Id = id,
                VetClinicId = vetClinicId,
                DayOfWeek = dayOfWeek,
                StartTime = startTime,
                EndTime = endTime,
                IsActive = isActive,
                CreatedAt = createdAt,
                UpdatedAt = updatedAt
            };
        }

        public static DoctorScheduleDomain Create(Guid vetClinicId, int dayOfWeek, TimeOnly startTime, TimeOnly endTime)
        {
            if (dayOfWeek < 0 || dayOfWeek > 6)
                throw new DomainException("Ngày trong tuần không hợp lệ (0=CN, 1=T2, ..., 6=T7).");
            if (startTime >= endTime)
                throw new DomainException("Giờ bắt đầu phải trước giờ kết thúc.");

            return new DoctorScheduleDomain(vetClinicId, dayOfWeek, startTime, endTime);
        }

        public void Update(TimeOnly? startTime, TimeOnly? endTime)
        {
            var newStart = startTime ?? StartTime;
            var newEnd = endTime ?? EndTime;

            if (newStart >= newEnd)
                throw new DomainException("Giờ bắt đầu phải trước giờ kết thúc.");

            StartTime = newStart;
            EndTime = newEnd;
            UpdatedAt = DateTime.UtcNow;
        }

        public void Deactivate()
        {
            IsActive = false;
            UpdatedAt = DateTime.UtcNow;
        }
    }
}
