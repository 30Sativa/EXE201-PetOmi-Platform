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

        public async Task<PaymentTransactionDomain?> GetByIdAsync(Guid paymentTransactionId)
        {
            var entity = await _context.PaymentTransactions.FindAsync(paymentTransactionId);
            return entity?.ToDomain();
        }

        public async Task AddAsync(PaymentTransactionDomain transaction)
        {
            await _context.PaymentTransactions.AddAsync(transaction.ToEntity());
        }

        public async Task MarkMatchedAsync(Guid transactionId, Guid invoiceId, Guid? reviewedByUserId = null, string? reviewNote = null)
        {
            var entity = await _context.PaymentTransactions.FindAsync(transactionId);
            if (entity == null)
            {
                return;
            }

            entity.InvoiceId = invoiceId;
            entity.IsMatched = true;

            if (reviewedByUserId.HasValue || !string.IsNullOrWhiteSpace(reviewNote))
            {
                entity.ReviewedByUserId = reviewedByUserId;
                entity.ReviewNote = NormalizeReviewNote(reviewNote);
                entity.ReviewedAt = DateTime.UtcNow;
            }
        }

        public async Task MarkDismissedAsync(Guid transactionId, Guid reviewedByUserId, string reviewNote)
        {
            var entity = await _context.PaymentTransactions.FindAsync(transactionId);
            if (entity == null)
            {
                return;
            }

            entity.InvoiceId = null;
            entity.IsMatched = true;
            entity.ReviewedByUserId = reviewedByUserId;
            entity.ReviewNote = NormalizeReviewNote(reviewNote);
            entity.ReviewedAt = DateTime.UtcNow;
        }

        public async Task<int> CountUnresolvedByClinicIdAsync(Guid clinicId)
        {
            return await _context.PaymentTransactions
                .Where(x => x.ClinicId == clinicId && !x.IsMatched)
                .CountAsync();
        }

        public async Task<IReadOnlyList<PaymentTransactionDomain>> GetRecentByInvoiceOrPaymentReferenceAsync(
            Guid clinicId,
            Guid invoiceId,
            string? paymentReference,
            int limit)
        {
            var normalizedReference = string.IsNullOrWhiteSpace(paymentReference)
                ? null
                : paymentReference.Trim();

            var query = _context.PaymentTransactions
                .Where(x => x.ClinicId == clinicId);

            query = string.IsNullOrWhiteSpace(normalizedReference)
                ? query.Where(x => x.InvoiceId == invoiceId)
                : query.Where(x =>
                    x.InvoiceId == invoiceId ||
                    (x.TransferContent != null && x.TransferContent.Contains(normalizedReference)));

            return await query
                .OrderByDescending(x => x.CreatedAt)
                .Take(limit)
                .Select(x => x.ToDomain())
                .ToListAsync();
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

        private static string? NormalizeReviewNote(string? reviewNote)
        {
            var normalized = reviewNote?.Trim();
            return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
        }
    }
}
