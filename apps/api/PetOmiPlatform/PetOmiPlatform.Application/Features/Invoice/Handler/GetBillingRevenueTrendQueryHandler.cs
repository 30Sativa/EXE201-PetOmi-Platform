using MediatR;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Response;
using PetOmiPlatform.Application.Features.Invoice.Query;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Invoice.Handler
{
    public class GetBillingRevenueTrendQueryHandler : IRequestHandler<GetBillingRevenueTrendQuery, BillingRevenueTrendResponse>
    {
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IInvoiceRepository _invoiceRepository;

        public GetBillingRevenueTrendQueryHandler(
            IVetClinicRepository vetClinicRepository,
            IInvoiceRepository invoiceRepository)
        {
            _vetClinicRepository = vetClinicRepository;
            _invoiceRepository = invoiceRepository;
        }

        public async Task<BillingRevenueTrendResponse> Handle(GetBillingRevenueTrendQuery request, CancellationToken cancellationToken)
        {
            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(request.StaffUserId, request.ClinicId);
            ClinicRoleGuard.RequireInvoiceViewer(staff);

            var summaries = await _invoiceRepository.GetPaidRevenueTrendByClinicAsync(
                request.ClinicId,
                request.FromDate,
                request.ToDate);

            var mapByDate = summaries.ToDictionary(x => x.Date);
            var points = new List<BillingRevenueTrendPointResponse>();

            for (var date = request.FromDate; date <= request.ToDate; date = date.AddDays(1))
            {
                if (mapByDate.TryGetValue(date, out var row))
                {
                    points.Add(new BillingRevenueTrendPointResponse
                    {
                        Date = date,
                        Revenue = row.Revenue,
                        PaidInvoiceCount = row.PaidInvoiceCount,
                        CashRevenue = row.CashRevenue,
                        CashInvoiceCount = row.CashInvoiceCount,
                        BankTransferRevenue = row.BankTransferRevenue,
                        BankTransferInvoiceCount = row.BankTransferInvoiceCount,
                        SePayRevenue = row.SePayRevenue,
                        SePayInvoiceCount = row.SePayInvoiceCount
                    });
                }
                else
                {
                    points.Add(new BillingRevenueTrendPointResponse
                    {
                        Date = date,
                        Revenue = 0m,
                        PaidInvoiceCount = 0,
                        CashRevenue = 0m,
                        CashInvoiceCount = 0,
                        BankTransferRevenue = 0m,
                        BankTransferInvoiceCount = 0,
                        SePayRevenue = 0m,
                        SePayInvoiceCount = 0
                    });
                }
            }

            return new BillingRevenueTrendResponse
            {
                FromDate = request.FromDate,
                ToDate = request.ToDate,
                TotalRevenue = points.Sum(x => x.Revenue),
                TotalPaidInvoiceCount = points.Sum(x => x.PaidInvoiceCount),
                TotalCashRevenue = points.Sum(x => x.CashRevenue),
                TotalCashInvoiceCount = points.Sum(x => x.CashInvoiceCount),
                TotalBankTransferRevenue = points.Sum(x => x.BankTransferRevenue),
                TotalBankTransferInvoiceCount = points.Sum(x => x.BankTransferInvoiceCount),
                TotalSePayRevenue = points.Sum(x => x.SePayRevenue),
                TotalSePayInvoiceCount = points.Sum(x => x.SePayInvoiceCount),
                Points = points
            };
        }
    }
}
