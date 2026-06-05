using PetOmiPlatform.Domain.Entities;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IAppointmentRepository
    {
        Task AddAsync(AppointmentDomain appointment);
        Task<AppointmentDomain?> GetByIdAsync(Guid appointmentId);

        /// <summary>Clinic staff xem lịch hẹn của clinic, filter theo ngày và status.</summary>
        Task<IEnumerable<AppointmentDomain>> GetByClinicAsync(
            Guid clinicId,
            string? status,
            DateOnly? date,
            string? search,
            int page,
            int pageSize);

        Task<int> CountByClinicAsync(Guid clinicId, string? status, DateOnly? date, string? search);

        /// <summary>Owner xem lịch hẹn của pet/bản thân.</summary>
        Task<IEnumerable<AppointmentDomain>> GetByOwnerAsync(
            Guid ownerUserId,
            int page,
            int pageSize);

        Task<int> CountByOwnerAsync(Guid ownerUserId);

        /// <summary>
        /// Lấy lịch hẹn theo PetId (dùng cho Activity Feed).
        /// </summary>
        Task<IEnumerable<AppointmentDomain>> GetByPetIdAsync(Guid petId, int page, int pageSize);

        /// <summary>
        /// Đếm tổng lịch hẹn theo PetId (dùng cho Activity Feed pagination).
        /// </summary>
        Task<int> CountByPetIdAsync(Guid petId);

        /// <summary>
        /// Kiểm tra bác sĩ có bị double booking không.
        /// Nếu excludeId != null → bỏ qua appointment đó (dùng khi reschedule).
        /// </summary>
        Task<bool> HasConflictAsync(
            Guid vetClinicId,
            DateOnly date,
            TimeOnly startTime,
            TimeOnly endTime,
            Guid? excludeId = null);

        /// <summary>
        /// Kiểm tra bác sĩ có conflict ở bất kỳ clinic nào trong danh sách VetClinicIds.
        /// Dùng khi bác sĩ làm ở nhiều clinic.
        /// </summary>
        Task<bool> HasDoctorConflictAcrossClinicsAsync(
            List<Guid> allVetClinicIds,
            DateOnly date,
            TimeOnly startTime,
            TimeOnly endTime,
            Guid? excludeId = null);

        /// <summary>Lấy danh sách Pending quá timeout để Hangfire xử lý expire.</summary>
        Task<IEnumerable<AppointmentDomain>> GetPendingExpiredAsync(int timeoutMinutes = 30);

        Task UpdateAsync(AppointmentDomain appointment);

        Task<int> CountAllAsync();
    }
}
