using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Exceptions;

namespace PetOmiPlatform.Domain.Entities
{
    public class PaymentTransactionDomain : BaseEntity
    {
        public Guid? InvoiceId { get; private set; }
        public Guid ClinicId { get; private set; }
        public PaymentProvider Provider { get; private set; }
        public string ProviderTransactionId { get; private set; } = string.Empty;
        public string? ReferenceCode { get; private set; }
        public string? TransferContent { get; private set; }
        public string TransferType { get; private set; } = "in";
        public decimal TransferAmount { get; private set; }
        public string? Gateway { get; private set; }
        public string? AccountNumber { get; private set; }
        public DateTime? TransactionDate { get; private set; }
        public bool IsMatched { get; private set; }
        public string? RawPayload { get; private set; }
        public DateTime CreatedAt { get; private set; }

        private PaymentTransactionDomain() { }

        public static PaymentTransactionDomain Create(
            Guid clinicId,
            PaymentProvider provider,
            string providerTransactionId,
            string transferType,
            decimal transferAmount,
            string? referenceCode = null,
            string? transferContent = null,
            string? gateway = null,
            string? accountNumber = null,
            DateTime? transactionDate = null,
            string? rawPayload = null)
        {
            if (provider != PaymentProvider.SePay)
                throw new DomainException("Payment transaction hien tai chi ho tro provider SePay.");
            if (string.IsNullOrWhiteSpace(providerTransactionId))
                throw new DomainException("ProviderTransactionId khong hop le.");
            if (transferType != "in" && transferType != "out")
                throw new DomainException("TransferType phai la 'in' hoac 'out'.");
            if (transferAmount < 0)
                throw new DomainException("TransferAmount khong duoc am.");

            return new PaymentTransactionDomain
            {
                Id = Guid.NewGuid(),
                ClinicId = clinicId,
                Provider = provider,
                ProviderTransactionId = providerTransactionId.Trim(),
                TransferType = transferType,
                TransferAmount = transferAmount,
                ReferenceCode = referenceCode?.Trim(),
                TransferContent = transferContent?.Trim(),
                Gateway = gateway?.Trim(),
                AccountNumber = accountNumber?.Trim(),
                TransactionDate = transactionDate,
                RawPayload = rawPayload,
                CreatedAt = DateTime.UtcNow
            };
        }

        public static PaymentTransactionDomain Reconstitute(
            Guid id,
            Guid? invoiceId,
            Guid clinicId,
            PaymentProvider provider,
            string providerTransactionId,
            string? referenceCode,
            string? transferContent,
            string transferType,
            decimal transferAmount,
            string? gateway,
            string? accountNumber,
            DateTime? transactionDate,
            bool isMatched,
            string? rawPayload,
            DateTime createdAt)
        {
            return new PaymentTransactionDomain
            {
                Id = id,
                InvoiceId = invoiceId,
                ClinicId = clinicId,
                Provider = provider,
                ProviderTransactionId = providerTransactionId,
                ReferenceCode = referenceCode,
                TransferContent = transferContent,
                TransferType = transferType,
                TransferAmount = transferAmount,
                Gateway = gateway,
                AccountNumber = accountNumber,
                TransactionDate = transactionDate,
                IsMatched = isMatched,
                RawPayload = rawPayload,
                CreatedAt = createdAt
            };
        }

        public void MarkMatched(Guid invoiceId)
        {
            InvoiceId = invoiceId;
            IsMatched = true;
        }
    }
}
