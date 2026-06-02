using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Exceptions;

namespace PetOmiPlatform.Domain.Entities
{
    /// <summary>Clinic inventory items (medication/supplies/products).</summary>
    public class InventoryItemDomain : BaseEntity
    {
        public Guid ClinicId { get; private set; }
        public string ItemName { get; private set; } = null!;
        public string? Unit { get; private set; }
        public int Quantity { get; private set; }
        public int LowStockThreshold { get; private set; }
        public decimal? UnitPrice { get; private set; }
        public DateOnly? ExpiryDate { get; private set; }
        public string? ImageUrl { get; private set; }
        public string? ImageCloudinaryPublicId { get; private set; }
        public bool IsActive { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public DateTime? UpdatedAt { get; private set; }

        public bool IsLowStock => Quantity <= LowStockThreshold;
        public bool IsExpired => ExpiryDate.HasValue && ExpiryDate.Value < DateOnly.FromDateTime(DateTime.UtcNow);

        private InventoryItemDomain() { }

        private InventoryItemDomain(
            Guid clinicId,
            string itemName,
            string? unit,
            int quantity,
            int lowStockThreshold,
            decimal? unitPrice,
            DateOnly? expiryDate,
            string? imageUrl,
            string? imageCloudinaryPublicId)
        {
            Id = Guid.NewGuid();
            ClinicId = clinicId;
            ItemName = itemName;
            Unit = unit;
            Quantity = quantity;
            LowStockThreshold = lowStockThreshold;
            UnitPrice = unitPrice;
            ExpiryDate = expiryDate;
            ImageUrl = imageUrl;
            ImageCloudinaryPublicId = imageCloudinaryPublicId;
            IsActive = true;
            CreatedAt = DateTime.UtcNow;
        }

        public static InventoryItemDomain Reconstitute(
            Guid id,
            Guid clinicId,
            string itemName,
            string? unit,
            int quantity,
            int lowStockThreshold,
            decimal? unitPrice,
            DateOnly? expiryDate,
            string? imageUrl,
            string? imageCloudinaryPublicId,
            bool isActive,
            DateTime createdAt,
            DateTime? updatedAt)
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
                ImageUrl = imageUrl,
                ImageCloudinaryPublicId = imageCloudinaryPublicId,
                IsActive = isActive,
                CreatedAt = createdAt,
                UpdatedAt = updatedAt
            };
        }

        public static InventoryItemDomain Create(
            Guid clinicId,
            string itemName,
            string? unit,
            int quantity,
            int lowStockThreshold,
            decimal? unitPrice,
            DateOnly? expiryDate,
            string? imageUrl = null,
            string? imageCloudinaryPublicId = null)
        {
            if (string.IsNullOrWhiteSpace(itemName))
                throw new DomainException("Ten vat tu/thuoc khong duoc de trong.");
            if (quantity < 0)
                throw new DomainException("So luong ton kho khong duoc am.");
            if (lowStockThreshold < 0)
                throw new DomainException("Nguong canh bao khong duoc am.");

            return new InventoryItemDomain(
                clinicId,
                itemName,
                unit,
                quantity,
                lowStockThreshold,
                unitPrice,
                expiryDate,
                imageUrl,
                imageCloudinaryPublicId);
        }

        public void StockIn(int amount)
        {
            if (amount <= 0) throw new DomainException("So luong nhap phai lon hon 0.");
            Quantity += amount;
            UpdatedAt = DateTime.UtcNow;
        }

        public void StockOut(int amount)
        {
            if (amount <= 0) throw new DomainException("So luong xuat phai lon hon 0.");
            if (amount > Quantity) throw new DomainException($"Ton kho khong du. Hien co: {Quantity}.");
            Quantity -= amount;
            UpdatedAt = DateTime.UtcNow;
        }

        public void UpdateInfo(
            string? itemName,
            string? unit,
            int? lowStockThreshold,
            decimal? unitPrice,
            DateOnly? expiryDate)
        {
            if (!string.IsNullOrWhiteSpace(itemName)) ItemName = itemName;
            if (unit != null) Unit = unit;
            if (lowStockThreshold.HasValue)
            {
                if (lowStockThreshold.Value < 0) throw new DomainException("Nguong canh bao khong duoc am.");
                LowStockThreshold = lowStockThreshold.Value;
            }
            if (unitPrice.HasValue) UnitPrice = unitPrice;
            if (expiryDate.HasValue) ExpiryDate = expiryDate;
            UpdatedAt = DateTime.UtcNow;
        }

        public void UpdateImage(string? imageUrl, string? imageCloudinaryPublicId)
        {
            ImageUrl = imageUrl;
            ImageCloudinaryPublicId = imageCloudinaryPublicId;
            UpdatedAt = DateTime.UtcNow;
        }

        public void Deactivate()
        {
            IsActive = false;
            UpdatedAt = DateTime.UtcNow;
        }
    }
}
