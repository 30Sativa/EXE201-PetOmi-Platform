using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;

namespace PetOmiPlatform.Infrastructure.Mappers
{
    public static class ClinicPaymentAccountMapper
    {
        public static ClinicPaymentAccountDomain ToDomain(this ClinicPaymentAccount entity) =>
            ClinicPaymentAccountDomain.Reconstitute(
                id: entity.ClinicPaymentAccountId,
                clinicId: entity.ClinicId,
                provider: Enum.Parse<PaymentProvider>(entity.Provider),
                bankCode: entity.BankCode,
                bankName: entity.BankName,
                accountNumber: entity.AccountNumber,
                accountName: entity.AccountName,
                isActive: entity.IsActive,
                createdAt: entity.CreatedAt,
                updatedAt: entity.UpdatedAt
            );
    }
}
