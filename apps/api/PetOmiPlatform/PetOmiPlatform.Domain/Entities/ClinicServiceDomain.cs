using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Exceptions;

namespace PetOmiPlatform.Domain.Entities
{
    public class ClinicServiceDomain : BaseEntity
    {
        public Guid ClinicId { get; private set; }
        public string ServiceName { get; private set; } = null!;
        public string? Description { get; private set; }
        public decimal Price { get; private set; }
        public int DurationMins { get; private set; }   // Quan trọng: dùng để tính slot booking
        public bool IsActive { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public DateTime? UpdatedAt { get; private set; }

        // === Constructors ===
        private ClinicServiceDomain() { }

        private ClinicServiceDomain(Guid clinicId, string serviceName, string? description,
            decimal price, int durationMins)
        {
            Id = Guid.NewGuid();
            ClinicId = clinicId;
            ServiceName = serviceName;
            Description = description;
            Price = price;
            DurationMins = durationMins;
            IsActive = true;
            CreatedAt = DateTime.UtcNow;
        }

        public static ClinicServiceDomain Reconstitute(
            Guid id, Guid clinicId, string serviceName, string? description,
            decimal price, int durationMins, bool isActive,
            DateTime createdAt, DateTime? updatedAt)
        {
            return new ClinicServiceDomain
            {
                Id = id,
                ClinicId = clinicId,
                ServiceName = serviceName,
                Description = description,
                Price = price,
                DurationMins = durationMins,
                IsActive = isActive,
                CreatedAt = createdAt,
                UpdatedAt = updatedAt
            };
        }

        public static ClinicServiceDomain Create(
            Guid clinicId, string serviceName, string? description,
            decimal price, int durationMins)
        {
            if (string.IsNullOrWhiteSpace(serviceName))
                throw new DomainException("Tên dịch vụ không được để trống.");
            if (price < 0)
                throw new DomainException("Giá dịch vụ không được âm.");
            if (durationMins <= 0)
                throw new DomainException("Thời lượng dịch vụ phải lớn hơn 0 phút.");

            return new ClinicServiceDomain(clinicId, serviceName, description, price, durationMins);
        }

        public void Update(string? serviceName, string? description, decimal? price, int? durationMins)
        {
            if (!IsActive)
                throw new DomainException("Không thể cập nhật dịch vụ đã bị vô hiệu hóa.");

            if (!string.IsNullOrWhiteSpace(serviceName)) ServiceName = serviceName;
            if (description != null) Description = description;

            if (price.HasValue)
            {
                if (price.Value < 0) throw new DomainException("Giá dịch vụ không được âm.");
                Price = price.Value;
            }

            if (durationMins.HasValue)
            {
                if (durationMins.Value <= 0) throw new DomainException("Thời lượng phải lớn hơn 0 phút.");
                DurationMins = durationMins.Value;
            }

            UpdatedAt = DateTime.UtcNow;
        }

        public void Deactivate()
        {
            if (!IsActive)
                throw new DomainException("Dịch vụ này đã bị vô hiệu hóa rồi.");
            IsActive = false;
            UpdatedAt = DateTime.UtcNow;
        }
    }
}
