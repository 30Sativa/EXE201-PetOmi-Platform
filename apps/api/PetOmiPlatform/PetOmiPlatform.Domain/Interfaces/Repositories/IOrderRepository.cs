using PetOmiPlatform.Domain.Entities;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IOrderRepository
    {
        Task AddAsync(OrderDomain order);
        Task AddItemsAsync(IEnumerable<OrderItemDomain> items);
        Task<OrderDomain?> GetByIdAsync(Guid orderId);
        Task<IEnumerable<OrderItemDomain>> GetItemsByOrderIdAsync(Guid orderId);
        Task<bool> HasActiveInvoiceAsync(Guid orderId);
        Task UpdateAsync(OrderDomain order);
    }
}
