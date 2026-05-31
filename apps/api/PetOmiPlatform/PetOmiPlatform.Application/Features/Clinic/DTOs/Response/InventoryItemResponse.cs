namespace PetOmiPlatform.Application.Features.Clinic.DTOs.Response
{
    public class InventoryItemResponse
    {
        public Guid ItemId { get; set; }
        public string ItemName { get; set; } = null!;
        public string? Unit { get; set; }
        public int Quantity { get; set; }
        public int LowStockThreshold { get; set; }
        public bool IsLowStock { get; set; }
        public decimal? UnitPrice { get; set; }
        public DateOnly? ExpiryDate { get; set; }
        public string? ImageUrl { get; set; }
        public string? ImageCloudinaryPublicId { get; set; }
        public bool IsExpired { get; set; }
        public bool IsActive { get; set; }
    }
}
