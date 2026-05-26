using MediatR;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Response;
using PetOmiPlatform.Application.Features.Invoice.Query;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Invoice.Handler
{
    public class GetBillingDashboardSummaryQueryHandler : IRequestHandler<GetBillingDashboardSummaryQuery, BillingDashboardSummaryResponse>
    {
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IInvoiceRepository _invoiceRepository;
        private readonly IPaymentTransactionRepository _paymentTransactionRepository;

        public GetBillingDashboardSummaryQueryHandler(
            IVetClinicRepository vetClinicRepository,
            IInvoiceRepository invoiceRepository,
            IPaymentTransactionRepository paymentTransactionRepository)
        {
            _vetClinicRepository = vetClinicRepository;
            _invoiceRepository = invoiceRepository;
            _paymentTransactionRepository = paymentTransactionRepository;
        }

        public async Task<BillingDashboardSummaryResponse> Handle(GetBillingDashboardSummaryQuery request, CancellationToken cancellationToken)
        {
            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(request.StaffUserId, request.ClinicId);
            ClinicRoleGuard.RequireInvoiceViewer(staff);

            var (unpaidCount, unpaidAmount) = await _invoiceRepository.GetUnpaidSummaryByClinicIdAsync(request.ClinicId);
            var pendingReconciliationCount = await _paymentTransactionRepository.CountUnresolvedByClinicIdAsync(request.ClinicId);

            return new BillingDashboardSummaryResponse
            {
                UnpaidInvoiceCount = unpaidCount,
                TotalUnpaidAmount = unpaidAmount,
                PendingReconciliationCount = pendingReconciliationCount
            };
        }
    }
}
