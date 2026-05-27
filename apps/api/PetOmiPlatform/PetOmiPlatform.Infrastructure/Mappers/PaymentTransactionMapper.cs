using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;

namespace PetOmiPlatform.Infrastructure.Mappers
{
    public static class PaymentTransactionMapper
    {
        public static PaymentTransactionDomain ToDomain(this PaymentTransaction entity) =>
            PaymentTransactionDomain.Reconstitute(
                id: entity.PaymentTransactionId,
                invoiceId: entity.InvoiceId,
                clinicId: entity.ClinicId,
                provider: Enum.Parse<PaymentProvider>(entity.Provider),
                providerTransactionId: entity.ProviderTransactionId,
                referenceCode: entity.ReferenceCode,
                transferContent: entity.TransferContent,
                transferType: entity.TransferType,
                transferAmount: entity.TransferAmount,
                gateway: entity.Gateway,
                accountNumber: entity.AccountNumber,
                transactionDate: entity.TransactionDate,
                isMatched: entity.IsMatched,
                reviewNote: entity.ReviewNote,
                reviewedByUserId: entity.ReviewedByUserId,
                reviewedAt: entity.ReviewedAt,
                rawPayload: entity.RawPayload,
                createdAt: entity.CreatedAt
            );

        public static PaymentTransaction ToEntity(this PaymentTransactionDomain domain) =>
            new PaymentTransaction
            {
                PaymentTransactionId = domain.Id,
                InvoiceId = domain.InvoiceId,
                ClinicId = domain.ClinicId,
                Provider = domain.Provider.ToString(),
                ProviderTransactionId = domain.ProviderTransactionId,
                ReferenceCode = domain.ReferenceCode,
                TransferContent = domain.TransferContent,
                TransferType = domain.TransferType,
                TransferAmount = domain.TransferAmount,
                Gateway = domain.Gateway,
                AccountNumber = domain.AccountNumber,
                TransactionDate = domain.TransactionDate,
                IsMatched = domain.IsMatched,
                ReviewNote = domain.ReviewNote,
                ReviewedByUserId = domain.ReviewedByUserId,
                ReviewedAt = domain.ReviewedAt,
                RawPayload = domain.RawPayload,
                CreatedAt = domain.CreatedAt
            };
    }
}
