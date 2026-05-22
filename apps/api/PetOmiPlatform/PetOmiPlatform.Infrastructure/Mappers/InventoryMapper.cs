using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;

namespace PetOmiPlatform.Infrastructure.Mappers
{
    public static class InventoryMapper
    {
        public static InventoryItemDomain ToDomain(this Inventory entity)
        {
            return InventoryItemDomain.Reconstitute(
                id: entity.ItemId,
                clinicId: entity.ClinicId,
                itemName: entity.ItemName,
                unit: entity.Unit,
                quantity: entity.Quantity,
                lowStockThreshold: entity.LowStockThreshold,
                unitPrice: entity.UnitPrice,
                expiryDate: entity.ExpiryDate,
                isActive: entity.IsActive,
                createdAt: entity.CreatedAt,
                updatedAt: entity.UpdatedAt
            );
        }

        public static Inventory ToEntity(this InventoryItemDomain domain)
        {
            return new Inventory
            {
                ItemId = domain.Id,
                ClinicId = domain.ClinicId,
                ItemName = domain.ItemName,
                Unit = domain.Unit,
                Quantity = domain.Quantity,
                LowStockThreshold = domain.LowStockThreshold,
                UnitPrice = domain.UnitPrice,
                ExpiryDate = domain.ExpiryDate,
                IsActive = domain.IsActive,
                CreatedAt = domain.CreatedAt,
                UpdatedAt = domain.UpdatedAt
            };
        }
    }
}
