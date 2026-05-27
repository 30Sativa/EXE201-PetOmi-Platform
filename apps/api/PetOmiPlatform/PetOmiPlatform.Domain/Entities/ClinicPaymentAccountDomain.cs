using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Exceptions;

namespace PetOmiPlatform.Domain.Entities
{
    public class ClinicPaymentAccountDomain : BaseEntity
    {
        public Guid ClinicId { get; private set; }
        public PaymentProvider Provider { get; private set; }
        public string BankCode { get; private set; } = string.Empty;
        public string? BankName { get; private set; }
        public string AccountNumber { get; private set; } = string.Empty;
        public string? AccountName { get; private set; }
        public bool IsActive { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public DateTime? UpdatedAt { get; private set; }

        private ClinicPaymentAccountDomain() { }

        public static ClinicPaymentAccountDomain Create(
            Guid clinicId,
            PaymentProvider provider,
            string bankCode,
            string accountNumber,
            string? bankName = null,
            string? accountName = null)
        {
            if (provider != PaymentProvider.SePay)
                throw new DomainException("Clinic payment account hien tai chi ho tro provider SePay.");
            if (string.IsNullOrWhiteSpace(bankCode))
                throw new DomainException("BankCode khong hop le.");
            if (string.IsNullOrWhiteSpace(accountNumber))
                throw new DomainException("AccountNumber khong hop le.");

            return new ClinicPaymentAccountDomain
            {
                Id = Guid.NewGuid(),
                ClinicId = clinicId,
                Provider = provider,
                BankCode = bankCode.Trim(),
                BankName = bankName?.Trim(),
                AccountNumber = accountNumber.Trim(),
                AccountName = accountName?.Trim(),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
        }

        public static ClinicPaymentAccountDomain Reconstitute(
            Guid id,
            Guid clinicId,
            PaymentProvider provider,
            string bankCode,
            string? bankName,
            string accountNumber,
            string? accountName,
            bool isActive,
            DateTime createdAt,
            DateTime? updatedAt)
        {
            return new ClinicPaymentAccountDomain
            {
                Id = id,
                ClinicId = clinicId,
                Provider = provider,
                BankCode = bankCode,
                BankName = bankName,
                AccountNumber = accountNumber,
                AccountName = accountName,
                IsActive = isActive,
                CreatedAt = createdAt,
                UpdatedAt = updatedAt
            };
        }
    }
}
