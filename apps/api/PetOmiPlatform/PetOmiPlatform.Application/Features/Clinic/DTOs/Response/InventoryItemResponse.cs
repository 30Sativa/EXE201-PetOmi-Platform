namespace PetOmiPlatform.Application.Features.Clinic.DTOs.Response
{
    public class InventoryItemResponse
    {
        public Guid ItemId { get; set; }
        public string ItemName { get; set; } = null!;
        public string? Unit { get; set; }
        public int Quantity { get; set; }
        public int LowStockThreshold { get; set; }
        public bool IsLowStock { get; set; }         // Cảnh báo hết hàng
        public decimal? UnitPrice { get; set; }
        public DateOnly? ExpiryDate { get; set; }
        public bool IsExpired { get; set; }          // Cảnh báo hết hạn
        public bool IsActive { get; set; }
    }
}
