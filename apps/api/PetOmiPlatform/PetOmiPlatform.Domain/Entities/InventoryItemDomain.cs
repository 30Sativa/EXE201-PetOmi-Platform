using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Exceptions;

namespace PetOmiPlatform.Domain.Entities
{
    /// <summary>Kho thuốc / vật tư cơ bản của phòng khám — scope MVP.</summary>
    public class InventoryItemDomain : BaseEntity
    {
        public Guid ClinicId { get; private set; }
        public string ItemName { get; private set; } = null!;
        public string? Unit { get; private set; }            // "viên", "ml", "lọ"...
        public int Quantity { get; private set; }            // Tồn kho hiện tại
        public int LowStockThreshold { get; private set; }  // Ngưỡng cảnh báo hết
        public decimal? UnitPrice { get; private set; }
        public DateOnly? ExpiryDate { get; private set; }   // Hạn dùng
        public bool IsActive { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public DateTime? UpdatedAt { get; private set; }

        // Computed
        public bool IsLowStock => Quantity <= LowStockThreshold;
        public bool IsExpired => ExpiryDate.HasValue && ExpiryDate.Value < DateOnly.FromDateTime(DateTime.UtcNow);

        private InventoryItemDomain() { }

        private InventoryItemDomain(Guid clinicId, string itemName, string? unit,
            int quantity, int lowStockThreshold, decimal? unitPrice, DateOnly? expiryDate)
        {
            Id = Guid.NewGuid();
            ClinicId = clinicId;
            ItemName = itemName;
            Unit = unit;
            Quantity = quantity;
            LowStockThreshold = lowStockThreshold;
            UnitPrice = unitPrice;
            ExpiryDate = expiryDate;
            IsActive = true;
            CreatedAt = DateTime.UtcNow;
        }

        public static InventoryItemDomain Reconstitute(
            Guid id, Guid clinicId, string itemName, string? unit,
            int quantity, int lowStockThreshold, decimal? unitPrice,
            DateOnly? expiryDate, bool isActive,
            DateTime createdAt, DateTime? updatedAt)
        {
            return new InventoryItemDomain
            {
                Id = id,
                ClinicId = clinicId,
                ItemName = itemName,
                Unit = unit,
                Quantity = quantity,
                LowStockThreshold = lowStockThreshold,
                UnitPrice = unitPrice,
                ExpiryDate = expiryDate,
                IsActive = isActive,
                CreatedAt = createdAt,
                UpdatedAt = updatedAt
            };
        }

        public static InventoryItemDomain Create(
            Guid clinicId, string itemName, string? unit,
            int quantity, int lowStockThreshold,
            decimal? unitPrice, DateOnly? expiryDate)
        {
            if (string.IsNullOrWhiteSpace(itemName))
                throw new DomainException("Tên vật tư / thuốc không được để trống.");
            if (quantity < 0)
                throw new DomainException("Số lượng tồn kho không được âm.");
            if (lowStockThreshold < 0)
                throw new DomainException("Ngưỡng cảnh báo không được âm.");

            return new InventoryItemDomain(clinicId, itemName, unit, quantity, lowStockThreshold, unitPrice, expiryDate);
        }

        /// <summary>Nhập thêm hàng.</summary>
        public void StockIn(int amount)
        {
            if (amount <= 0) throw new DomainException("Số lượng nhập phải lớn hơn 0.");
            Quantity += amount;
            UpdatedAt = DateTime.UtcNow;
        }

        /// <summary>Xuất hàng (dùng cho kê đơn).</summary>
        public void StockOut(int amount)
        {
            if (amount <= 0) throw new DomainException("Số lượng xuất phải lớn hơn 0.");
            if (amount > Quantity) throw new DomainException($"Tồn kho không đủ. Hiện có: {Quantity}.");
            Quantity -= amount;
            UpdatedAt = DateTime.UtcNow;
        }

        public void UpdateInfo(string? itemName, string? unit, int? lowStockThreshold,
            decimal? unitPrice, DateOnly? expiryDate)
        {
            if (!string.IsNullOrWhiteSpace(itemName)) ItemName = itemName;
            if (unit != null) Unit = unit;
            if (lowStockThreshold.HasValue)
            {
                if (lowStockThreshold.Value < 0) throw new DomainException("Ngưỡng cảnh báo không được âm.");
                LowStockThreshold = lowStockThreshold.Value;
            }
            if (unitPrice.HasValue) UnitPrice = unitPrice;
            if (expiryDate.HasValue) ExpiryDate = expiryDate;
            UpdatedAt = DateTime.UtcNow;
        }

        public void Deactivate()
        {
            IsActive = false;
            UpdatedAt = DateTime.UtcNow;
        }
    }
}
