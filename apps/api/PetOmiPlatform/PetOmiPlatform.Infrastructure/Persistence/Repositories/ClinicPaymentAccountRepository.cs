using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Infrastructure.Mappers;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories
{
    public class ClinicPaymentAccountRepository : IClinicPaymentAccountRepository
    {
        private readonly PetOmniDbContext _context;

        public ClinicPaymentAccountRepository(PetOmniDbContext context)
        {
            _context = context;
        }

        public async Task<ClinicPaymentAccountDomain?> GetActiveByClinicIdAndProviderAsync(Guid clinicId, PaymentProvider provider)
        {
            var providerName = provider.ToString();
            var entity = await _context.ClinicPaymentAccounts
                .Where(x => x.ClinicId == clinicId && x.Provider == providerName && x.IsActive)
                .OrderByDescending(x => x.CreatedAt)
                .FirstOrDefaultAsync();

            return entity?.ToDomain();
        }

        public async Task<ClinicPaymentAccountDomain?> GetActiveByProviderAndAccountNumberAsync(PaymentProvider provider, string accountNumber)
        {
            var providerName = provider.ToString();
            var entity = await _context.ClinicPaymentAccounts
                .Where(x => x.Provider == providerName && x.AccountNumber == accountNumber && x.IsActive)
                .OrderByDescending(x => x.CreatedAt)
                .FirstOrDefaultAsync();

            return entity?.ToDomain();
        }

        public async Task UpsertActiveSePayAccountAsync(
            Guid clinicId,
            string bankCode,
            string accountNumber,
            string? bankName,
            string? accountName)
        {
            var providerName = PaymentProvider.SePay.ToString();
            var existing = await _context.ClinicPaymentAccounts
                .Where(x => x.ClinicId == clinicId && x.Provider == providerName && x.IsActive)
                .OrderByDescending(x => x.CreatedAt)
                .FirstOrDefaultAsync();

            if (existing == null)
            {
                await _context.ClinicPaymentAccounts.AddAsync(new Persistence.Entities.ClinicPaymentAccount
                {
                    ClinicPaymentAccountId = Guid.NewGuid(),
                    ClinicId = clinicId,
                    Provider = providerName,
                    BankCode = bankCode,
                    BankName = bankName,
                    AccountNumber = accountNumber,
                    AccountName = accountName,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                });
                return;
            }

            existing.BankCode = bankCode;
            existing.BankName = bankName;
            existing.AccountNumber = accountNumber;
            existing.AccountName = accountName;
            existing.IsActive = true;
            existing.UpdatedAt = DateTime.UtcNow;
        }
    }
}
