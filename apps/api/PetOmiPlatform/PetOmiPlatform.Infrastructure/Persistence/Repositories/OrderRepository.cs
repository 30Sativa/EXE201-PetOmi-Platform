using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Infrastructure.Mappers;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories
{
    public class OrderRepository : IOrderRepository
    {
        private readonly PetOmniDbContext _context;

        public OrderRepository(PetOmniDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(OrderDomain order)
        {
            await _context.Orders.AddAsync(order.ToEntity());
        }

        public async Task AddItemsAsync(IEnumerable<OrderItemDomain> items)
        {
            await _context.OrderItems.AddRangeAsync(items.Select(x => x.ToEntity()));
        }

        public async Task<OrderDomain?> GetByIdAsync(Guid orderId)
        {
            var entity = await _context.Orders
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.OrderId == orderId);

            return entity?.ToDomain();
        }

        public async Task<IEnumerable<OrderItemDomain>> GetItemsByOrderIdAsync(Guid orderId)
        {
            return await _context.OrderItems
                .AsNoTracking()
                .Where(x => x.OrderId == orderId)
                .OrderBy(x => x.CreatedAt)
                .Select(x => x.ToDomain())
                .ToListAsync();
        }

        public async Task<bool> HasActiveInvoiceAsync(Guid orderId)
        {
            return await _context.Invoices
                .AnyAsync(x => x.OrderId == orderId && (x.Status == "Unpaid" || x.Status == "Paid"));
        }

        public async Task UpdateAsync(OrderDomain order)
        {
            var entity = await _context.Orders.FindAsync(order.Id);
            if (entity == null) return;

            _context.Entry(entity).CurrentValues.SetValues(order.ToEntity());
        }
    }
}
