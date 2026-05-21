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
            int page,
            int pageSize);

        Task<int> CountByClinicAsync(Guid clinicId, string? status, DateOnly? date);

        /// <summary>Owner xem lịch hẹn của pet/bản thân.</summary>
        Task<IEnumerable<AppointmentDomain>> GetByOwnerAsync(
            Guid ownerUserId,
            int page,
            int pageSize);

        Task<int> CountByOwnerAsync(Guid ownerUserId);

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

        /// <summary>Lấy danh sách Pending quá timeout để Hangfire xử lý expire.</summary>
        Task<IEnumerable<AppointmentDomain>> GetPendingExpiredAsync(int timeoutMinutes = 30);

        Task UpdateAsync(AppointmentDomain appointment);
    }
}
