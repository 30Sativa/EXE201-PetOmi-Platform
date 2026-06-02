using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;
using PetOmiPlatform.Domain.Entities;

namespace PetOmiPlatform.Application.Features.Clinic.Mappers
{
    /// <summary>Extension methods mapping Domain → Response DTO cho Inventory.</summary>
    public static class InventoryResponseMapper
    {
        public static InventoryItemResponse ToResponse(this InventoryItemDomain item) => new()
        {
            ItemId = item.Id,
            ItemName = item.ItemName,
            Unit = item.Unit,
            Quantity = item.Quantity,
            LowStockThreshold = item.LowStockThreshold,
            IsLowStock = item.IsLowStock,
            UnitPrice = item.UnitPrice,
            ExpiryDate = item.ExpiryDate,
            ImageUrl = item.ImageUrl,
            ImageCloudinaryPublicId = item.ImageCloudinaryPublicId,
            IsExpired = item.IsExpired,
            IsActive = item.IsActive
        };
    }
}
