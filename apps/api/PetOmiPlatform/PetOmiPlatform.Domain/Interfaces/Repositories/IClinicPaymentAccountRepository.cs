using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IClinicPaymentAccountRepository
    {
        Task<ClinicPaymentAccountDomain?> GetActiveByClinicIdAndProviderAsync(Guid clinicId, PaymentProvider provider);
        Task<ClinicPaymentAccountDomain?> GetActiveByProviderAndAccountNumberAsync(PaymentProvider provider, string accountNumber);
        Task UpsertActiveSePayAccountAsync(
            Guid clinicId,
            string bankCode,
            string accountNumber,
            string? bankName,
            string? accountName);
    }
}
