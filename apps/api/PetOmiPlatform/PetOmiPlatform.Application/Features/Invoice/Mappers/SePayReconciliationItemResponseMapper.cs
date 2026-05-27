using PetOmiPlatform.Application.Features.Invoice.DTOs.Response;
using PetOmiPlatform.Domain.Entities;

namespace PetOmiPlatform.Application.Features.Invoice.Mappers
{
    public static class SePayReconciliationItemResponseMapper
    {
        public static SePayReconciliationItemResponse ToReconciliationItemResponse(
            this PaymentTransactionDomain transaction,
            IReadOnlyDictionary<Guid, InvoiceDomain> invoiceMap,
            int alertAfterMinutes,
            DateTime nowUtc)
        {
            InvoiceDomain? invoice = null;
            if (transaction.InvoiceId.HasValue)
            {
                invoiceMap.TryGetValue(transaction.InvoiceId.Value, out invoice);
            }

            var status = ResolveStatus(transaction, invoice);
            var pendingMinutes = ResolvePendingMinutes(transaction, nowUtc);
            var needsAttention = IsOpenStatus(status) && pendingMinutes >= alertAfterMinutes;

            return new SePayReconciliationItemResponse
            {
                PaymentTransactionId = transaction.Id,
                ProviderTransactionId = transaction.ProviderTransactionId,
                TransferType = transaction.TransferType,
                TransferAmount = transaction.TransferAmount,
                TransactionDate = transaction.TransactionDate,
                ReferenceCode = transaction.ReferenceCode,
                TransferContent = transaction.TransferContent,
                Status = status,
                InvoiceId = invoice?.Id,
                InvoiceCode = invoice?.InvoiceCode,
                InvoiceFinalAmount = invoice?.FinalAmount,
                ReviewNote = transaction.ReviewNote,
                ReviewedByUserId = transaction.ReviewedByUserId,
                ReviewedAt = transaction.ReviewedAt,
                PendingMinutes = pendingMinutes,
                AlertAfterMinutes = alertAfterMinutes,
                NeedsAttention = needsAttention
            };
        }

        private static string ResolveStatus(PaymentTransactionDomain transaction, InvoiceDomain? invoice)
        {
            if (transaction.IsMatched && invoice != null)
            {
                return "Matched";
            }

            if (transaction.IsMatched && invoice == null)
            {
                return "Dismissed";
            }

            if (invoice == null)
            {
                return "Unmapped";
            }

            if (!string.Equals(transaction.TransferType, "in", StringComparison.OrdinalIgnoreCase))
            {
                return "DirectionMismatch";
            }

            if (transaction.TransferAmount < invoice.FinalAmount)
            {
                return "AmountMismatch";
            }

            return "PendingReview";
        }

        private static int ResolvePendingMinutes(PaymentTransactionDomain transaction, DateTime nowUtc)
        {
            var createdAtUtc = transaction.TransactionDate ?? transaction.CreatedAt;
            var pending = nowUtc - createdAtUtc;
            if (pending.TotalMinutes < 0)
            {
                return 0;
            }

            return (int)Math.Floor(pending.TotalMinutes);
        }

        private static bool IsOpenStatus(string status) =>
            status is "Unmapped" or "DirectionMismatch" or "AmountMismatch" or "PendingReview";
    }
}
