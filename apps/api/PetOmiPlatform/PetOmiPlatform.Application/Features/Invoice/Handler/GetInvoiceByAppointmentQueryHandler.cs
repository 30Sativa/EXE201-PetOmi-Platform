using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Response;
using PetOmiPlatform.Application.Features.Invoice.Mappers;
using PetOmiPlatform.Application.Features.Invoice.Query;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Invoice.Handler
{
    public class GetInvoiceByAppointmentQueryHandler : IRequestHandler<GetInvoiceByAppointmentQuery, InvoiceResponse?>
    {
        private readonly IInvoiceRepository _invoiceRepository;
        private readonly IVetClinicRepository _vetClinicRepository;

        public GetInvoiceByAppointmentQueryHandler(
            IInvoiceRepository invoiceRepository,
            IVetClinicRepository vetClinicRepository)
        {
            _invoiceRepository = invoiceRepository;
            _vetClinicRepository = vetClinicRepository;
        }

        public async Task<InvoiceResponse?> Handle(GetInvoiceByAppointmentQuery request, CancellationToken cancellationToken)
        {
            var invoice = await _invoiceRepository.GetByAppointmentIdAsync(request.AppointmentId);
            
            if (invoice == null) return null;

            if (invoice.ClinicId != request.ClinicId)
                throw new ForbiddenException("Không có quyền xem hóa đơn này.");

            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(request.StaffUserId, request.ClinicId);
            ClinicRoleGuard.RequireInvoiceViewer(staff);

            var items = await _invoiceRepository.GetItemsByInvoiceIdAsync(invoice.Id);

            return invoice.ToResponse(items);
        }
    }
}
