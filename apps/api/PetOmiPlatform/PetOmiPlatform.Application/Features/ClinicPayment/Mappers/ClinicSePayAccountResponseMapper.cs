using PetOmiPlatform.Application.Features.ClinicPayment.DTOs.Response;
using PetOmiPlatform.Domain.Entities;

namespace PetOmiPlatform.Application.Features.ClinicPayment.Mappers
{
    public static class ClinicSePayAccountResponseMapper
    {
        public static ClinicSePayAccountResponse ToResponse(this ClinicPaymentAccountDomain account)
        {
            return new ClinicSePayAccountResponse
            {
                ClinicId = account.ClinicId,
                Provider = account.Provider.ToString(),
                BankCode = account.BankCode,
                BankName = account.BankName,
                AccountNumberMasked = MaskAccountNumber(account.AccountNumber),
                AccountName = account.AccountName,
                IsActive = account.IsActive
            };
        }

        private static string MaskAccountNumber(string accountNumber)
        {
            if (accountNumber.Length <= 4)
            {
                return accountNumber;
            }

            var visibleTail = accountNumber[^4..];
            return new string('*', accountNumber.Length - 4) + visibleTail;
        }
    }
}
