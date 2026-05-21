using PetOmiPlatform.Domain.Entities;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IDoctorScheduleRepository
    {
        Task AddAsync(DoctorScheduleDomain schedule);
        Task<DoctorScheduleDomain?> GetByIdAsync(Guid scheduleId);
        Task<IEnumerable<DoctorScheduleDomain>> GetByVetClinicIdAsync(Guid vetClinicId, bool activeOnly = true);

        /// <summary>Lấy lịch của tất cả bác sĩ trong clinic — dùng để hiển thị lịch tuần.</summary>
        Task<IEnumerable<DoctorScheduleDomain>> GetByClinicIdAsync(Guid clinicId, bool activeOnly = true);
        /// <summary>Lấy lịch bác sĩ theo clinic và thứ trong tuần — dùng tính available slots.</summary>
        Task<IEnumerable<DoctorScheduleDomain>> GetByClinicAndDayAsync(Guid clinicId, int dayOfWeek);

        Task UpdateAsync(DoctorScheduleDomain schedule);
        Task DeleteAsync(Guid scheduleId);
    }
}
