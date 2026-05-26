using MediatR;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Response;
using PetOmiPlatform.Application.Features.Invoice.Query;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Invoice.Handler
{
    public class GetSePayReconciliationQueryHandler : IRequestHandler<GetSePayReconciliationQuery, IReadOnlyList<SePayReconciliationItemResponse>>
    {
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IPaymentTransactionRepository _paymentTransactionRepository;
        private readonly IInvoiceRepository _invoiceRepository;

        public GetSePayReconciliationQueryHandler(
            IVetClinicRepository vetClinicRepository,
            IPaymentTransactionRepository paymentTransactionRepository,
            IInvoiceRepository invoiceRepository)
        {
            _vetClinicRepository = vetClinicRepository;
            _paymentTransactionRepository = paymentTransactionRepository;
            _invoiceRepository = invoiceRepository;
        }

        public async Task<IReadOnlyList<SePayReconciliationItemResponse>> Handle(GetSePayReconciliationQuery request, CancellationToken cancellationToken)
        {
            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(request.StaffUserId, request.ClinicId);
            ClinicRoleGuard.RequireInvoiceViewer(staff);

            var transactions = await _paymentTransactionRepository.GetRecentByClinicIdAsync(
                request.ClinicId,
                request.Limit,
                request.IncludeMatched);

            var invoiceMap = await BuildInvoiceMapAsync(transactions);
            return transactions.Select(tx => ToResponse(tx, invoiceMap)).ToList();
        }

        private async Task<Dictionary<Guid, InvoiceDomain>> BuildInvoiceMapAsync(IReadOnlyList<PaymentTransactionDomain> transactions)
        {
            var ids = transactions
                .Where(x => x.InvoiceId.HasValue)
                .Select(x => x.InvoiceId!.Value)
                .Distinct()
                .ToList();

            var result = new Dictionary<Guid, InvoiceDomain>();
            foreach (var id in ids)
            {
                var invoice = await _invoiceRepository.GetByIdAsync(id);
                if (invoice != null)
                {
                    result[id] = invoice;
                }
            }

            return result;
        }

        private static SePayReconciliationItemResponse ToResponse(
            PaymentTransactionDomain transaction,
            IReadOnlyDictionary<Guid, InvoiceDomain> invoiceMap)
        {
            InvoiceDomain? invoice = null;
            if (transaction.InvoiceId.HasValue)
            {
                invoiceMap.TryGetValue(transaction.InvoiceId.Value, out invoice);
            }

            return new SePayReconciliationItemResponse
            {
                PaymentTransactionId = transaction.Id,
                ProviderTransactionId = transaction.ProviderTransactionId,
                TransferType = transaction.TransferType,
                TransferAmount = transaction.TransferAmount,
                TransactionDate = transaction.TransactionDate,
                ReferenceCode = transaction.ReferenceCode,
                TransferContent = transaction.TransferContent,
                Status = ResolveStatus(transaction, invoice),
                InvoiceId = invoice?.Id,
                InvoiceCode = invoice?.InvoiceCode,
                InvoiceFinalAmount = invoice?.FinalAmount,
                ReviewNote = transaction.ReviewNote,
                ReviewedByUserId = transaction.ReviewedByUserId,
                ReviewedAt = transaction.ReviewedAt
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

            if (transaction.TransferType != "in")
            {
                return "DirectionMismatch";
            }

            if (transaction.TransferAmount < invoice.FinalAmount)
            {
                return "AmountMismatch";
            }

            return "PendingReview";
        }
    }
}
