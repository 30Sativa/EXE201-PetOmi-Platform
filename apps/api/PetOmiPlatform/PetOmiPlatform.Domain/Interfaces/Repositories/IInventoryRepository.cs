using PetOmiPlatform.Domain.Entities;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IInventoryRepository
    {
        Task AddAsync(InventoryItemDomain item);
        Task<InventoryItemDomain?> GetByIdAsync(Guid itemId);
        Task<IEnumerable<InventoryItemDomain>> GetByClinicIdAsync(Guid clinicId, bool activeOnly = true);

        /// <summary>Lấy danh sách thuốc sắp hết (IsLowStock = true).</summary>
        Task<IEnumerable<InventoryItemDomain>> GetLowStockItemsAsync(Guid clinicId);
        Task UpdateAsync(InventoryItemDomain item);
    }
}
