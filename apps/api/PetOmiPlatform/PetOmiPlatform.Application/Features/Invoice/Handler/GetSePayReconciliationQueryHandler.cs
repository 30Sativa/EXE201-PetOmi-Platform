using MediatR;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Response;
using PetOmiPlatform.Application.Features.Invoice.Mappers;
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
            return transactions
                .Select(tx => tx.ToReconciliationItemResponse(invoiceMap, request.AlertAfterMinutes, DateTime.UtcNow))
                .ToList();
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
    }
}
