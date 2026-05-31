namespace PetOmiPlatform.Application.Features.Clinic.DTOs.Request
{
    public class AddInventoryItemRequest
    {
        public string ItemName { get; set; } = null!;
        public string? Unit { get; set; }              // "viên", "ml", "lọ"
        public int Quantity { get; set; }
        public int LowStockThreshold { get; set; } = 10;
        public decimal? UnitPrice { get; set; }
        public DateOnly? ExpiryDate { get; set; }
        public string? ImageUrl { get; set; }
        public string? ImageCloudinaryPublicId { get; set; }
    }
}
