using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IPaymentTransactionRepository
    {
        Task<bool> ExistsByProviderTransactionIdAsync(PaymentProvider provider, string providerTransactionId);
        Task<PaymentTransactionDomain?> GetByIdAsync(Guid paymentTransactionId);
        Task AddAsync(PaymentTransactionDomain transaction);
        Task MarkMatchedAsync(Guid transactionId, Guid invoiceId, Guid? reviewedByUserId = null, string? reviewNote = null);
        Task MarkDismissedAsync(Guid transactionId, Guid reviewedByUserId, string reviewNote);
        Task<int> CountUnresolvedByClinicIdAsync(Guid clinicId);
        Task<IReadOnlyList<PaymentTransactionDomain>> GetRecentByInvoiceOrPaymentReferenceAsync(
            Guid clinicId,
            Guid invoiceId,
            string? paymentReference,
            int limit);
        Task<IReadOnlyList<PaymentTransactionDomain>> GetRecentByClinicIdAsync(
            Guid clinicId,
            int limit,
            bool includeMatched);
    }
}
