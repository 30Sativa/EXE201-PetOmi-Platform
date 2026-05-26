using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Infrastructure.Mappers;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories
{
    public class PaymentTransactionRepository : IPaymentTransactionRepository
    {
        private readonly PetOmniDbContext _context;

        public PaymentTransactionRepository(PetOmniDbContext context)
        {
            _context = context;
        }

        public async Task<bool> ExistsByProviderTransactionIdAsync(PaymentProvider provider, string providerTransactionId)
        {
            var providerName = provider.ToString();
            return await _context.PaymentTransactions.AnyAsync(x =>
                x.Provider == providerName && x.ProviderTransactionId == providerTransactionId);
        }

        public async Task AddAsync(PaymentTransactionDomain transaction)
        {
            await _context.PaymentTransactions.AddAsync(transaction.ToEntity());
        }

        public async Task MarkMatchedAsync(Guid transactionId, Guid invoiceId)
        {
            var entity = await _context.PaymentTransactions.FindAsync(transactionId);
            if (entity == null)
            {
                return;
            }

            entity.InvoiceId = invoiceId;
            entity.IsMatched = true;
        }

        public async Task<IReadOnlyList<PaymentTransactionDomain>> GetRecentByClinicIdAsync(
            Guid clinicId,
            int limit,
            bool includeMatched)
        {
            var query = _context.PaymentTransactions
                .Where(x => x.ClinicId == clinicId);

            if (!includeMatched)
            {
                query = query.Where(x => !x.IsMatched);
            }

            return await query
                .OrderByDescending(x => x.CreatedAt)
                .Take(limit)
                .Select(x => x.ToDomain())
                .ToListAsync();
        }
    }
}
