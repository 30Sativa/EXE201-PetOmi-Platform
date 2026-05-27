using MediatR;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Response;
using PetOmiPlatform.Application.Features.Invoice.Mappers;
using PetOmiPlatform.Application.Features.Invoice.Query;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Invoice.Handler
{
    public class GetInvoiceAgingQueryHandler : IRequestHandler<GetInvoiceAgingQuery, IReadOnlyList<InvoiceAgingItemResponse>>
    {
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IInvoiceRepository _invoiceRepository;

        public GetInvoiceAgingQueryHandler(
            IVetClinicRepository vetClinicRepository,
            IInvoiceRepository invoiceRepository)
        {
            _vetClinicRepository = vetClinicRepository;
            _invoiceRepository = invoiceRepository;
        }

        public async Task<IReadOnlyList<InvoiceAgingItemResponse>> Handle(GetInvoiceAgingQuery request, CancellationToken cancellationToken)
        {
            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(request.StaffUserId, request.ClinicId);
            ClinicRoleGuard.RequireInvoiceViewer(staff);

            var invoices = await _invoiceRepository.GetByClinicIdAsync(request.ClinicId, request.Page, request.PageSize);
            var todayUtc = DateTime.UtcNow;

            return invoices
                .Where(x => x.Status == InvoiceStatus.Unpaid)
                .Select(x => x.ToAgingItemResponse(todayUtc))
                .Where(x => x.PendingDays >= request.MinAgeDays)
                .OrderByDescending(x => x.PendingDays)
                .ThenBy(x => x.CreatedAt)
                .ToList();
        }
    }
}
