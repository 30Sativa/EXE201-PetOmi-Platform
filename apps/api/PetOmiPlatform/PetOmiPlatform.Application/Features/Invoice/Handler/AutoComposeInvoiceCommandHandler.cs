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
    public class AutoComposeInvoiceCommandHandler : IRequestHandler<AutoComposeInvoiceCommand, InvoiceResponse>
    {
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IClinicServiceRepository _clinicServiceRepository;
        private readonly IInventoryRepository _inventoryRepository;
        private readonly IInvoiceRepository _invoiceRepository;
        private readonly IMedicalExaminationRepository _medicalExaminationRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly IPrescriptionRepository _prescriptionRepository;
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IUnitOfWork _unitOfWork;

        public AutoComposeInvoiceCommandHandler(
            IAppointmentRepository appointmentRepository,
            IClinicServiceRepository clinicServiceRepository,
            IInventoryRepository inventoryRepository,
            IInvoiceRepository invoiceRepository,
            IMedicalExaminationRepository medicalExaminationRepository,
            IOrderRepository orderRepository,
            IPrescriptionRepository prescriptionRepository,
            IVetClinicRepository vetClinicRepository,
            IUnitOfWork unitOfWork)
        {
            _appointmentRepository = appointmentRepository;
            _clinicServiceRepository = clinicServiceRepository;
            _inventoryRepository = inventoryRepository;
            _invoiceRepository = invoiceRepository;
            _medicalExaminationRepository = medicalExaminationRepository;
            _orderRepository = orderRepository;
            _prescriptionRepository = prescriptionRepository;
            _vetClinicRepository = vetClinicRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<InvoiceResponse> Handle(AutoComposeInvoiceCommand request, CancellationToken cancellationToken)
        {
            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(request.StaffUserId, request.ClinicId);
            ClinicRoleGuard.RequireInvoiceWriter(staff);

            AppointmentDomain? appointment = null;
            if (request.Payload.AppointmentId.HasValue)
            {
                appointment = await _appointmentRepository.GetByIdAsync(request.Payload.AppointmentId.Value)
                    ?? throw new NotFoundException("Appointment", request.Payload.AppointmentId.Value);
                if (appointment.ClinicId != request.ClinicId)
                    throw new ForbiddenException("Không có quyền tạo hóa đơn cho lịch hẹn này.");
                if (await _invoiceRepository.HasActiveInvoiceAsync(appointment.Id))
                    throw new ConflictException("Lịch hẹn này đã có hóa đơn active.");
            }

            OrderDomain? order = null;
            if (request.Payload.OrderId.HasValue)
            {
                order = await _orderRepository.GetByIdAsync(request.Payload.OrderId.Value)
                    ?? throw new NotFoundException("Order", request.Payload.OrderId.Value);
                if (order.ClinicId != request.ClinicId)
                    throw new ForbiddenException("Không có quyền tạo hóa đơn cho đơn hàng này.");
                if (await _invoiceRepository.HasActiveOrderInvoiceAsync(order.Id))
                    throw new ConflictException("Đơn hàng này đã có hóa đơn active.");
            }

            if (appointment == null && order == null)
                throw new ValidationException("InvoiceSource", "Auto-compose cần AppointmentId, OrderId hoặc cả hai.");

            var examination = appointment == null
                ? null
                : await ResolveExaminationAsync(request, appointment.Id);

            var items = await ComposeInvoiceItemsAsync(request, appointment, examination, order);
            if (items.Count == 0)
                throw new ConflictException("Không đủ dữ liệu để auto-compose hóa đơn. Hãy tạo hóa đơn thủ công.");

            var totalAmount = items.Sum(x => x.Quantity * x.UnitPrice);
            var invoice = InvoiceDomain.Create(
                appointmentId: appointment?.Id,
                clinicId: request.ClinicId,
                totalAmount: totalAmount,
                discountAmount: request.Payload.DiscountAmount,
                examinationId: examination?.Id,
                orderId: order?.Id,
                notes: request.Payload.Notes);

            var finalizedItems = items.Select(x => InvoiceItemDomain.Create(
                invoiceId: invoice.Id,
                itemType: x.ItemType,
                description: x.Description,
                quantity: x.Quantity,
                unitPrice: x.UnitPrice,
                serviceId: x.ServiceId,
                inventoryItemId: x.InventoryItemId,
                orderItemId: x.OrderItemId,
                prescriptionId: x.PrescriptionId)).ToList();

            order?.MarkInvoiced();

            await _invoiceRepository.AddAsync(invoice);
            await _invoiceRepository.AddItemsAsync(finalizedItems);
            if (order != null)
                await _orderRepository.UpdateAsync(order);

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var warnings = BuildComposeWarnings(finalizedItems);
            return invoice.ToResponse(finalizedItems, warnings);
        }

        private async Task<MedicalExaminationDomain?> ResolveExaminationAsync(
            AutoComposeInvoiceCommand request,
            Guid appointmentId)
        {
            if (request.Payload.ExaminationId.HasValue)
            {
                var examination = await _medicalExaminationRepository.GetByIdAsync(request.Payload.ExaminationId.Value)
                    ?? throw new NotFoundException("MedicalExamination", request.Payload.ExaminationId.Value);

                if (examination.AppointmentId != appointmentId)
                    throw new ConflictException("Phiếu khám không thuộc lịch hẹn đang tạo hóa đơn.");

                return examination;
            }

            return await _medicalExaminationRepository.GetByAppointmentIdAsync(appointmentId);
        }

        private async Task<List<InvoiceComposeLine>> ComposeInvoiceItemsAsync(
            AutoComposeInvoiceCommand request,
            AppointmentDomain? appointment,
            MedicalExaminationDomain? examination,
            OrderDomain? order)
        {
            var items = new List<InvoiceComposeLine>();

            if (request.Payload.IncludeService && appointment?.ServiceId.HasValue == true)
            {
                var service = await _clinicServiceRepository.GetByIdAsync(appointment.ServiceId.Value);
                if (service != null && service.ClinicId == request.ClinicId)
                {
                    items.Add(new InvoiceComposeLine(
                        InvoiceItemType.Service,
                        service.ServiceName,
                        1,
                        service.Price,
                        service.Id,
                        null,
                        null,
                        null));
                }
            }

            if (request.Payload.IncludePrescriptions && examination != null)
            {
                var prescriptions = (await _prescriptionRepository.GetByExaminationIdAsync(examination.Id)).ToList();
                var inventoryPriceCache = new Dictionary<Guid, decimal?>();
                foreach (var prescription in prescriptions)
                {
                    var unitPrice = await ResolveUnitPriceAsync(request.ClinicId, prescription.InventoryItemId, inventoryPriceCache);
                    items.Add(new InvoiceComposeLine(
                        InvoiceItemType.Medication,
                        BuildMedicationDescription(prescription),
                        1,
                        unitPrice ?? 0,
                        null,
                        prescription.InventoryItemId,
                        null,
                        prescription.Id));
                }
            }

            if (request.Payload.IncludeOrderItems && order != null)
            {
                var orderItems = await _orderRepository.GetItemsByOrderIdAsync(order.Id);
                items.AddRange(orderItems.Select(x => new InvoiceComposeLine(
                    InvoiceItemType.Product,
                    x.Description,
                    x.Quantity,
                    x.UnitPrice,
                    null,
                    x.InventoryItemId,
                    x.Id,
                    x.PrescriptionId)));
            }

            return items;
        }

        private async Task<decimal?> ResolveUnitPriceAsync(
            Guid clinicId,
            Guid? inventoryItemId,
            IDictionary<Guid, decimal?> cache)
        {
            if (!inventoryItemId.HasValue)
                return null;

            if (cache.TryGetValue(inventoryItemId.Value, out var cachedValue))
                return cachedValue;

            var inventoryItem = await _inventoryRepository.GetByIdAsync(inventoryItemId.Value);
            if (inventoryItem == null || inventoryItem.ClinicId != clinicId)
            {
                cache[inventoryItemId.Value] = null;
                return null;
            }

            cache[inventoryItemId.Value] = inventoryItem.UnitPrice;
            return inventoryItem.UnitPrice;
        }

        private static string BuildMedicationDescription(PrescriptionDomain prescription)
        {
            return $"{prescription.MedicationName} - {prescription.Dosage}, {prescription.Frequency}, {prescription.DurationDays} days";
        }

        private static List<string> BuildComposeWarnings(IEnumerable<InvoiceItemDomain> items)
        {
            return items
                .Where(x => x.UnitPrice == 0)
                .Select(x => $"Dòng '{x.Description}' chưa có đơn giá (UnitPrice = 0). Vui lòng kiểm tra trước khi thu tiền.")
                .ToList();
        }

        private record InvoiceComposeLine(
            InvoiceItemType ItemType,
            string Description,
            int Quantity,
            decimal UnitPrice,
            Guid? ServiceId,
            Guid? InventoryItemId,
            Guid? OrderItemId,
            Guid? PrescriptionId);
    }
}
