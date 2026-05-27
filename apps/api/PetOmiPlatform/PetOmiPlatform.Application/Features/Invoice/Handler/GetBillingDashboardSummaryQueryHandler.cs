using MediatR;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Response;
using PetOmiPlatform.Application.Features.Invoice.Query;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Invoice.Handler
{
    public class GetBillingDashboardSummaryQueryHandler : IRequestHandler<GetBillingDashboardSummaryQuery, BillingDashboardSummaryResponse>
    {
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IInvoiceRepository _invoiceRepository;
        private readonly IPaymentTransactionRepository _paymentTransactionRepository;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IInventoryRepository _inventoryRepository;

        public GetBillingDashboardSummaryQueryHandler(
            IVetClinicRepository vetClinicRepository,
            IInvoiceRepository invoiceRepository,
            IPaymentTransactionRepository paymentTransactionRepository,
            IAppointmentRepository appointmentRepository,
            IInventoryRepository inventoryRepository)
        {
            _vetClinicRepository = vetClinicRepository;
            _invoiceRepository = invoiceRepository;
            _paymentTransactionRepository = paymentTransactionRepository;
            _appointmentRepository = appointmentRepository;
            _inventoryRepository = inventoryRepository;
        }

        public async Task<BillingDashboardSummaryResponse> Handle(GetBillingDashboardSummaryQuery request, CancellationToken cancellationToken)
        {
            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(request.StaffUserId, request.ClinicId);
            ClinicRoleGuard.RequireInvoiceViewer(staff);

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var (unpaidCount, unpaidAmount) = await _invoiceRepository.GetUnpaidSummaryByClinicIdAsync(request.ClinicId);
            var pendingManualRefundCount = await _invoiceRepository.CountPendingManualRefundsByClinicIdAsync(request.ClinicId);
            var todayPaidRevenue = await _invoiceRepository.GetPaidRevenueByClinicAndDateAsync(request.ClinicId, today);
            var agingBuckets = await _invoiceRepository.GetUnpaidAgingBucketSummaryByClinicIdAsync(request.ClinicId);
            var pendingReconciliationCount = await _paymentTransactionRepository.CountUnresolvedByClinicIdAsync(request.ClinicId);
            var todayVisitCount = await _appointmentRepository.CountByClinicAsync(
                request.ClinicId,
                AppointmentStatus.Completed.ToString(),
                today);
            var lowStockItemCount = await _inventoryRepository.CountLowStockItemsAsync(request.ClinicId);

            return new BillingDashboardSummaryResponse
            {
                UnpaidInvoiceCount = unpaidCount,
                TotalUnpaidAmount = unpaidAmount,
                PendingReconciliationCount = pendingReconciliationCount,
                PendingManualRefundCount = pendingManualRefundCount,
                TodayVisitCount = todayVisitCount,
                TodayPaidRevenue = todayPaidRevenue,
                LowStockItemCount = lowStockItemCount,
                Aging0To7Days = new BillingAgingBucketResponse
                {
                    Count = agingBuckets.Count0To7Days,
                    Amount = agingBuckets.Amount0To7Days
                },
                Aging8To30Days = new BillingAgingBucketResponse
                {
                    Count = agingBuckets.Count8To30Days,
                    Amount = agingBuckets.Amount8To30Days
                },
                Aging31PlusDays = new BillingAgingBucketResponse
                {
                    Count = agingBuckets.Count31PlusDays,
                    Amount = agingBuckets.Amount31PlusDays
                }
            };
        }
    }
}
