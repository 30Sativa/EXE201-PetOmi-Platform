using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Exceptions;

namespace PetOmiPlatform.Domain.Entities
{
    public class AppointmentDomain : BaseEntity
    {
        // --- Properties ---
        public Guid ClinicId { get; private set; }
        public Guid? VetClinicId { get; private set; }      // assigned by clinic staff
        public Guid? ServiceId { get; private set; }
        public Guid PetId { get; private set; }
        public Guid BookedByUserId { get; private set; }

        public DateOnly AppointmentDate { get; private set; }
        public TimeOnly StartTime { get; private set; }
        public TimeOnly EndTime { get; private set; }

        public AppointmentType AppointmentType { get; private set; }
        public AppointmentStatus Status { get; private set; }

        public string? Notes { get; private set; }
        public string? CancellationReason { get; private set; }
        public bool IsWalkIn { get; private set; }
        public bool IsLateCancellation { get; private set; }

        public DateTime? ConfirmedAt { get; private set; }
        public DateTime? CancelledAt { get; private set; }
        public Guid? CancelledByUserId { get; private set; }

        public DateTime CreatedAt { get; private set; }
        public DateTime? UpdatedAt { get; private set; }

        private AppointmentDomain() { }

        // --- Factory: Owner đặt lịch online ---
        public static AppointmentDomain Book(
            Guid clinicId,
            Guid petId,
            Guid bookedByUserId,
            DateOnly appointmentDate,
            TimeOnly startTime,
            TimeOnly endTime,
            AppointmentType appointmentType,
            Guid? serviceId = null,
            string? notes = null)
        {
            if (appointmentDate < DateOnly.FromDateTime(DateTime.UtcNow.Date))
                throw new DomainException("Không thể đặt lịch trong quá khứ.");

            if (endTime <= startTime)
                throw new DomainException("Giờ kết thúc phải sau giờ bắt đầu.");

            return new AppointmentDomain
            {
                Id = Guid.NewGuid(),
                ClinicId = clinicId,
                ServiceId = serviceId,
                PetId = petId,
                BookedByUserId = bookedByUserId,
                AppointmentDate = appointmentDate,
                StartTime = startTime,
                EndTime = endTime,
                AppointmentType = appointmentType,
                Status = AppointmentStatus.Pending,
                Notes = notes,
                IsWalkIn = false,
                IsLateCancellation = false,
                CreatedAt = DateTime.UtcNow
            };
        }

        // --- Factory: Walk-in (staff tạo trực tiếp tại clinic) ---
        public static AppointmentDomain CreateWalkIn(
            Guid clinicId,
            Guid petId,
            Guid staffUserId,
            DateOnly appointmentDate,
            TimeOnly startTime,
            TimeOnly endTime,
            AppointmentType appointmentType,
            Guid? vetClinicId = null,
            Guid? serviceId = null,
            string? notes = null)
        {
            if (endTime <= startTime)
                throw new DomainException("Giờ kết thúc phải sau giờ bắt đầu.");

            return new AppointmentDomain
            {
                Id = Guid.NewGuid(),
                ClinicId = clinicId,
                VetClinicId = vetClinicId,
                ServiceId = serviceId,
                PetId = petId,
                BookedByUserId = staffUserId,
                AppointmentDate = appointmentDate,
                StartTime = startTime,
                EndTime = endTime,
                AppointmentType = appointmentType,
                Status = AppointmentStatus.Confirmed,   // walk-in xác nhận ngay
                Notes = notes,
                IsWalkIn = true,
                IsLateCancellation = false,
                ConfirmedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };
        }

        // --- Reconstitute (EF rehydration) ---
        public static AppointmentDomain Reconstitute(
            Guid id, Guid clinicId, Guid? vetClinicId, Guid? serviceId,
            Guid petId, Guid bookedByUserId,
            DateOnly appointmentDate, TimeOnly startTime, TimeOnly endTime,
            AppointmentType appointmentType, AppointmentStatus status,
            string? notes, string? cancellationReason,
            bool isWalkIn, bool isLateCancellation,
            DateTime? confirmedAt, DateTime? cancelledAt, Guid? cancelledByUserId,
            DateTime createdAt, DateTime? updatedAt)
        {
            return new AppointmentDomain
            {
                Id = id,
                ClinicId = clinicId,
                VetClinicId = vetClinicId,
                ServiceId = serviceId,
                PetId = petId,
                BookedByUserId = bookedByUserId,
                AppointmentDate = appointmentDate,
                StartTime = startTime,
                EndTime = endTime,
                AppointmentType = appointmentType,
                Status = status,
                Notes = notes,
                CancellationReason = cancellationReason,
                IsWalkIn = isWalkIn,
                IsLateCancellation = isLateCancellation,
                ConfirmedAt = confirmedAt,
                CancelledAt = cancelledAt,
                CancelledByUserId = cancelledByUserId,
                CreatedAt = createdAt,
                UpdatedAt = updatedAt
            };
        }

        // === Behaviors ===

        /// <summary>Clinic staff xác nhận appointment (Pending → Confirmed)</summary>
        public void Confirm(Guid staffUserId)
        {
            if (Status != AppointmentStatus.Pending)
                throw new DomainException($"Chỉ có thể xác nhận lịch đang chờ. Trạng thái hiện tại: {Status}");

            Status = AppointmentStatus.Confirmed;
            ConfirmedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }

        /// <summary>Clinic staff gán bác sĩ cho appointment</summary>
        public void AssignDoctor(Guid vetClinicId)
        {
            if (Status == AppointmentStatus.Completed || Status == AppointmentStatus.Cancelled)
                throw new DomainException("Không thể gán bác sĩ cho lịch đã kết thúc.");

            VetClinicId = vetClinicId;
            UpdatedAt = DateTime.UtcNow;
        }

        /// <summary>Clinic staff từ chối (Pending → Rejected)</summary>
        public void Reject(string reason)
        {
            if (Status != AppointmentStatus.Pending)
                throw new DomainException($"Chỉ có thể từ chối lịch đang chờ. Trạng thái: {Status}");

            if (string.IsNullOrWhiteSpace(reason))
                throw new DomainException("Lý do từ chối không được để trống.");

            Status = AppointmentStatus.Rejected;
            CancellationReason = reason;
            UpdatedAt = DateTime.UtcNow;
        }

        /// <summary>Hủy lịch (bởi owner hoặc staff). Áp dụng late cancellation policy.</summary>
        public void Cancel(Guid cancelledByUserId, string? reason = null)
        {
            if (Status == AppointmentStatus.Completed)
                throw new DomainException("Không thể hủy lịch đã hoàn thành.");

            if (Status == AppointmentStatus.Cancelled)
                throw new DomainException("Lịch này đã được hủy rồi.");

            // Late cancellation rule: hủy trong vòng 2 giờ trước giờ hẹn
            var appointmentDateTime = AppointmentDate.ToDateTime(StartTime, DateTimeKind.Utc);
            var hoursUntilAppt = (appointmentDateTime - DateTime.UtcNow).TotalHours;
            IsLateCancellation = hoursUntilAppt < 2.0;

            Status = AppointmentStatus.Cancelled;
            CancelledByUserId = cancelledByUserId;
            CancellationReason = reason;
            CancelledAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }

        /// <summary>Bác sĩ hoàn thành khám (Confirmed → Completed)</summary>
        public void Complete()
        {
            if (Status != AppointmentStatus.Confirmed)
                throw new DomainException($"Chỉ có thể hoàn thành lịch đã xác nhận. Trạng thái: {Status}");

            Status = AppointmentStatus.Completed;
            UpdatedAt = DateTime.UtcNow;
        }

        /// <summary>Timeout: Pending > 30 phút không xác nhận → Expired (gọi bởi Hangfire)</summary>
        public void MarkExpired()
        {
            if (Status != AppointmentStatus.Pending)
                throw new DomainException("Chỉ lịch đang chờ mới có thể expire.");

            Status = AppointmentStatus.Expired;
            UpdatedAt = DateTime.UtcNow;
        }

        /// <summary>Đổi lịch hẹn (chỉ Pending hoặc Confirmed, trước giờ hẹn)</summary>
        public void Reschedule(DateOnly newDate, TimeOnly newStart, TimeOnly newEnd)
        {
            if (Status == AppointmentStatus.Completed ||
                Status == AppointmentStatus.Cancelled ||
                Status == AppointmentStatus.Rejected ||
                Status == AppointmentStatus.Expired)
                throw new DomainException($"Không thể đổi lịch ở trạng thái {Status}.");

            if (newDate < DateOnly.FromDateTime(DateTime.UtcNow.Date))
                throw new DomainException("Không thể đổi về ngày trong quá khứ.");

            if (newEnd <= newStart)
                throw new DomainException("Giờ kết thúc phải sau giờ bắt đầu.");

            AppointmentDate = newDate;
            StartTime = newStart;
            EndTime = newEnd;

            // Reset về Pending để clinic xác nhận lại
            if (Status == AppointmentStatus.Confirmed)
                Status = AppointmentStatus.Pending;

            UpdatedAt = DateTime.UtcNow;
        }

        /// <summary>Kiểm tra lịch có expire chưa (dùng cho check-on-read bổ sung)</summary>
        public bool IsExpiredByTimeout(int timeoutMinutes = 30)
            => Status == AppointmentStatus.Pending &&
               DateTime.UtcNow - CreatedAt > TimeSpan.FromMinutes(timeoutMinutes);
    }
}
