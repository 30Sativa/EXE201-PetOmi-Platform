using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Invoice.Command;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Response;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Application.Interfaces;

namespace PetOmiPlatform.Application.Features.Invoice.Handler
{
    public class CreateInvoiceCommandHandler : IRequestHandler<CreateInvoiceCommand, InvoiceResponse>
    {
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IInvoiceRepository _invoiceRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CreateInvoiceCommandHandler(
            IAppointmentRepository appointmentRepository,
            IInvoiceRepository invoiceRepository,
            IUnitOfWork unitOfWork)
        {
            _appointmentRepository = appointmentRepository;
            _invoiceRepository = invoiceRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<InvoiceResponse> Handle(CreateInvoiceCommand request, CancellationToken cancellationToken)
        {
            var appointment = await _appointmentRepository.GetByIdAsync(request.Payload.AppointmentId);
            if (appointment == null)
                throw new NotFoundException($"Không tìm thấy lịch hẹn ID {request.Payload.AppointmentId}");

            if (appointment.ClinicId != request.ClinicId)
                throw new ForbiddenException("Không có quyền tạo hóa đơn cho lịch hẹn này.");

            var hasActiveInvoice = await _invoiceRepository.HasActiveInvoiceAsync(request.Payload.AppointmentId);
            if (hasActiveInvoice)
                throw new ConflictException("Lịch hẹn này đã có hóa đơn active.");

            var invoice = InvoiceDomain.Create(
                appointmentId: appointment.Id,
                clinicId: request.ClinicId,
                totalAmount: request.Payload.TotalAmount,
                discountAmount: request.Payload.DiscountAmount,
                examinationId: request.Payload.ExaminationId,
                notes: request.Payload.Notes
            );

            var items = request.Payload.Items.Select(i => InvoiceItemDomain.Create(
                invoiceId: invoice.Id,
                itemType: Enum.Parse<InvoiceItemType>(i.ItemType),
                description: i.Description,
                quantity: i.Quantity,
                unitPrice: i.UnitPrice,
                serviceId: i.ServiceId,
                inventoryItemId: i.InventoryItemId
            )).ToList();

            await _invoiceRepository.AddAsync(invoice);
            await _invoiceRepository.AddItemsAsync(items);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

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
                Notes = invoice.Notes,
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
