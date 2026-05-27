using PetOmiPlatform.Domain.Entities;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IInventoryRepository
    {
        Task AddAsync(InventoryItemDomain item);
        Task<InventoryItemDomain?> GetByIdAsync(Guid itemId);
        Task<IEnumerable<InventoryItemDomain>> GetByClinicIdAsync(Guid clinicId, bool activeOnly = true);
        Task<IEnumerable<InventoryItemDomain>> GetLowStockItemsAsync(Guid clinicId);
        Task<int> CountLowStockItemsAsync(Guid clinicId);
        Task UpdateAsync(InventoryItemDomain item);
    }
}
