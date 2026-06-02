using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Features.Invoice.Command;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Response;
using PetOmiPlatform.Application.Features.Invoice.Mappers;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Invoice.Handler
{
    public class CreateInvoiceCommandHandler : IRequestHandler<CreateInvoiceCommand, InvoiceResponse>
    {
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IInvoiceRepository _invoiceRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CreateInvoiceCommandHandler(
            IAppointmentRepository appointmentRepository,
            IInvoiceRepository invoiceRepository,
            IOrderRepository orderRepository,
            IVetClinicRepository vetClinicRepository,
            IUnitOfWork unitOfWork)
        {
            _appointmentRepository = appointmentRepository;
            _invoiceRepository = invoiceRepository;
            _orderRepository = orderRepository;
            _vetClinicRepository = vetClinicRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<InvoiceResponse> Handle(CreateInvoiceCommand request, CancellationToken cancellationToken)
        {
            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(request.StaffUserId, request.ClinicId);
            ClinicRoleGuard.RequireInvoiceWriter(staff);

            Guid? appointmentId = null;
            if (request.Payload.AppointmentId.HasValue)
            {
                var appointment = await _appointmentRepository.GetByIdAsync(request.Payload.AppointmentId.Value)
                    ?? throw new NotFoundException("Appointment", request.Payload.AppointmentId.Value);

                if (appointment.ClinicId != request.ClinicId)
                    throw new ForbiddenException("Khong co quyen tao hoa don cho lich hen nay.");

                if (await _invoiceRepository.HasActiveInvoiceAsync(appointment.Id))
                    throw new ConflictException("Lich hen nay da co hoa don active.");

                appointmentId = appointment.Id;
            }

            OrderDomain? order = null;
            if (request.Payload.OrderId.HasValue)
            {
                order = await _orderRepository.GetByIdAsync(request.Payload.OrderId.Value)
                    ?? throw new NotFoundException("Order", request.Payload.OrderId.Value);

                if (order.ClinicId != request.ClinicId)
                    throw new ForbiddenException("Khong co quyen tao hoa don cho don hang nay.");

                if (await _invoiceRepository.HasActiveOrderInvoiceAsync(order.Id))
                    throw new ConflictException("Don hang nay da co hoa don active.");
            }

            if (!appointmentId.HasValue && order == null)
                throw new ValidationException("InvoiceSource", "Hoa don phai co AppointmentId, OrderId hoac ca hai.");

            InvoiceSource? source = null;
            if (!string.IsNullOrWhiteSpace(request.Payload.InvoiceSource))
            {
                if (!Enum.TryParse<InvoiceSource>(request.Payload.InvoiceSource, true, out var parsedSource))
                    throw new ValidationException("InvoiceSource", $"Nguon hoa don khong hop le: {request.Payload.InvoiceSource}");
                source = parsedSource;
            }

            var invoice = InvoiceDomain.Create(
                appointmentId: appointmentId,
                clinicId: request.ClinicId,
                totalAmount: request.Payload.TotalAmount,
                discountAmount: request.Payload.DiscountAmount,
                examinationId: request.Payload.ExaminationId,
                orderId: order?.Id,
                invoiceSource: source,
                notes: request.Payload.Notes);

            var items = request.Payload.Items.Select(i => InvoiceItemDomain.Create(
                invoiceId: invoice.Id,
                itemType: Enum.Parse<InvoiceItemType>(i.ItemType, ignoreCase: true),
                description: i.Description,
                quantity: i.Quantity,
                unitPrice: i.UnitPrice,
                serviceId: i.ServiceId,
                inventoryItemId: i.InventoryItemId,
                orderItemId: i.OrderItemId,
                prescriptionId: i.PrescriptionId)).ToList();

            order?.MarkInvoiced();

            await _invoiceRepository.AddAsync(invoice);
            await _invoiceRepository.AddItemsAsync(items);
            if (order != null)
                await _orderRepository.UpdateAsync(order);

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return invoice.ToResponse(items);
        }
    }
}
