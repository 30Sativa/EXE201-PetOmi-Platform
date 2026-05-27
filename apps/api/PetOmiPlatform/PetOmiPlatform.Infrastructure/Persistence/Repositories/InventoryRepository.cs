using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Infrastructure.Mappers;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories
{
    public class InventoryRepository : IInventoryRepository
    {
        private readonly PetOmniDbContext _context;

        public InventoryRepository(PetOmniDbContext context) => _context = context;

        public async Task AddAsync(InventoryItemDomain item)
            => await _context.Inventories.AddAsync(item.ToEntity());

        public async Task<InventoryItemDomain?> GetByIdAsync(Guid itemId)
        {
            var entity = await _context.Inventories.FindAsync(itemId);
            return entity?.ToDomain();
        }

        public async Task<IEnumerable<InventoryItemDomain>> GetByClinicIdAsync(Guid clinicId, bool activeOnly = true)
        {
            var query = _context.Inventories.Where(i => i.ClinicId == clinicId);
            if (activeOnly) query = query.Where(i => i.IsActive);
            return await query.OrderBy(i => i.ItemName).Select(i => i.ToDomain()).ToListAsync();
        }

        public async Task<IEnumerable<InventoryItemDomain>> GetLowStockItemsAsync(Guid clinicId)
        {
            return await _context.Inventories
                .Where(i => i.ClinicId == clinicId && i.IsActive && i.Quantity <= i.LowStockThreshold)
                .OrderBy(i => i.Quantity)
                .Select(i => i.ToDomain())
                .ToListAsync();
        }

        public async Task<int> CountLowStockItemsAsync(Guid clinicId)
        {
            return await _context.Inventories
                .Where(i => i.ClinicId == clinicId && i.IsActive && i.Quantity <= i.LowStockThreshold)
                .CountAsync();
        }

        public async Task UpdateAsync(InventoryItemDomain item)
        {
            var entity = await _context.Inventories.FindAsync(item.Id);
            if (entity == null) return;
            _context.Entry(entity).CurrentValues.SetValues(item.ToEntity());
        }
    }
}
