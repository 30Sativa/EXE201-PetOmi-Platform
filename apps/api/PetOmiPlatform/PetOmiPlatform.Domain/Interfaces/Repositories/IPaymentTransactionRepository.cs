using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IPaymentTransactionRepository
    {
        Task<bool> ExistsByProviderTransactionIdAsync(PaymentProvider provider, string providerTransactionId);
        Task AddAsync(PaymentTransactionDomain transaction);
        Task MarkMatchedAsync(Guid transactionId, Guid invoiceId);
        Task<IReadOnlyList<PaymentTransactionDomain>> GetRecentByClinicIdAsync(
            Guid clinicId,
            int limit,
            bool includeMatched);
    }
}
