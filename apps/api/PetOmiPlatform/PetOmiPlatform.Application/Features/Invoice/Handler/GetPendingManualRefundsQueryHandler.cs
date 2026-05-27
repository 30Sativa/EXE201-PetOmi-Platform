using MediatR;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Response;
using PetOmiPlatform.Application.Features.Invoice.Mappers;
using PetOmiPlatform.Application.Features.Invoice.Query;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Invoice.Handler
{
    public class GetPendingManualRefundsQueryHandler : IRequestHandler<GetPendingManualRefundsQuery, IReadOnlyList<PendingManualRefundItemResponse>>
    {
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IInvoiceRepository _invoiceRepository;

        public GetPendingManualRefundsQueryHandler(
            IVetClinicRepository vetClinicRepository,
            IInvoiceRepository invoiceRepository)
        {
            _vetClinicRepository = vetClinicRepository;
            _invoiceRepository = invoiceRepository;
        }

        public async Task<IReadOnlyList<PendingManualRefundItemResponse>> Handle(GetPendingManualRefundsQuery request, CancellationToken cancellationToken)
        {
            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(request.StaffUserId, request.ClinicId);
            ClinicRoleGuard.RequireInvoiceViewer(staff);

            var invoices = await _invoiceRepository.GetPendingManualRefundsByClinicIdAsync(
                request.ClinicId,
                request.Page,
                request.PageSize);

            return invoices
                .Select(i => i.ToPendingManualRefundItemResponse())
                .ToList();
        }
    }
}
