using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Response;
using PetOmiPlatform.Application.Features.Invoice.Query;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Invoice.Handler
{
    public class GetInvoiceByAppointmentQueryHandler : IRequestHandler<GetInvoiceByAppointmentQuery, InvoiceResponse?>
    {
        private readonly IInvoiceRepository _invoiceRepository;

        public GetInvoiceByAppointmentQueryHandler(IInvoiceRepository invoiceRepository)
        {
            _invoiceRepository = invoiceRepository;
        }

        public async Task<InvoiceResponse?> Handle(GetInvoiceByAppointmentQuery request, CancellationToken cancellationToken)
        {
            var invoice = await _invoiceRepository.GetByAppointmentIdAsync(request.AppointmentId);
            
            if (invoice == null) return null;

            if (invoice.ClinicId != request.ClinicId)
                throw new ForbiddenException("Không có quyền xem hóa đơn này.");

            var items = await _invoiceRepository.GetItemsByInvoiceIdAsync(invoice.Id);

            return new InvoiceResponse
            {
                Id = invoice.Id,
                AppointmentId = invoice.AppointmentId,
                ExaminationId = invoice.ExaminationId,
                ClinicId = invoice.ClinicId,
                TotalAmount = invoice.TotalAmount,
                DiscountAmount = invoice.DiscountAmount,
                FinalAmount = invoice.FinalAmount,
                Status = invoice.Status.ToString(),
                PaymentMethod = invoice.PaymentMethod?.ToString(),
                Notes = invoice.Notes,
                PaidAt = invoice.PaidAt,
                CreatedAt = invoice.CreatedAt,
                Items = items.Select(i => new InvoiceItemResponse
                {
                    Id = i.Id,
                    ItemType = i.ItemType.ToString(),
                    Description = i.Description,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    TotalPrice = i.TotalPrice,
                    ServiceId = i.ServiceId,
                    InventoryItemId = i.InventoryItemId
                }).ToList()
            };
        }
    }
}
