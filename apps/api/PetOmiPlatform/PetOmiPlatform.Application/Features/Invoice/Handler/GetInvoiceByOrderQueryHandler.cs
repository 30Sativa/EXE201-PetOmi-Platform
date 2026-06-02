using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Response;
using PetOmiPlatform.Application.Features.Invoice.Mappers;
using PetOmiPlatform.Application.Features.Invoice.Query;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Invoice.Handler
{
    public class GetInvoiceByOrderQueryHandler : IRequestHandler<GetInvoiceByOrderQuery, InvoiceResponse?>
    {
        private readonly IInvoiceRepository _invoiceRepository;
        private readonly IVetClinicRepository _vetClinicRepository;

        public GetInvoiceByOrderQueryHandler(
            IInvoiceRepository invoiceRepository,
            IVetClinicRepository vetClinicRepository)
        {
            _invoiceRepository = invoiceRepository;
            _vetClinicRepository = vetClinicRepository;
        }

        public async Task<InvoiceResponse?> Handle(GetInvoiceByOrderQuery request, CancellationToken cancellationToken)
        {
            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(request.StaffUserId, request.ClinicId);
            ClinicRoleGuard.RequireActiveStaff(staff);

            var invoice = await _invoiceRepository.GetByOrderIdAsync(request.OrderId);
            if (invoice == null)
                return null;
            if (invoice.ClinicId != request.ClinicId)
                throw new ForbiddenException("Khong co quyen xem hoa don nay.");

            var items = await _invoiceRepository.GetItemsByInvoiceIdAsync(invoice.Id);
            return invoice.ToResponse(items);
        }
    }
}
