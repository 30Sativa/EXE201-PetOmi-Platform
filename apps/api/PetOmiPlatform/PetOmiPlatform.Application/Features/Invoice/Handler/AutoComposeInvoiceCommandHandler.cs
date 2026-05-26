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
        private readonly IPrescriptionRepository _prescriptionRepository;
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IUnitOfWork _unitOfWork;

        public AutoComposeInvoiceCommandHandler(
            IAppointmentRepository appointmentRepository,
            IClinicServiceRepository clinicServiceRepository,
            IInventoryRepository inventoryRepository,
            IInvoiceRepository invoiceRepository,
            IMedicalExaminationRepository medicalExaminationRepository,
            IPrescriptionRepository prescriptionRepository,
            IVetClinicRepository vetClinicRepository,
            IUnitOfWork unitOfWork)
        {
            _appointmentRepository = appointmentRepository;
            _clinicServiceRepository = clinicServiceRepository;
            _inventoryRepository = inventoryRepository;
            _invoiceRepository = invoiceRepository;
            _medicalExaminationRepository = medicalExaminationRepository;
            _prescriptionRepository = prescriptionRepository;
            _vetClinicRepository = vetClinicRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<InvoiceResponse> Handle(AutoComposeInvoiceCommand request, CancellationToken cancellationToken)
        {
            var appointment = await _appointmentRepository.GetByIdAsync(request.Payload.AppointmentId);
            if (appointment == null)
                throw new NotFoundException($"Khong tim thay lich hen ID {request.Payload.AppointmentId}");

            if (appointment.ClinicId != request.ClinicId)
                throw new ForbiddenException("Khong co quyen tao hoa don cho lich hen nay.");

            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(request.StaffUserId, request.ClinicId);
            ClinicRoleGuard.RequireInvoiceWriter(staff);

            var hasActiveInvoice = await _invoiceRepository.HasActiveInvoiceAsync(request.Payload.AppointmentId);
            if (hasActiveInvoice)
                throw new ConflictException("Lich hen nay da co hoa don active.");

            var examination = await ResolveExaminationAsync(request, appointment.Id);
            var items = await ComposeInvoiceItemsAsync(request, appointment, examination);
            if (items.Count == 0)
                throw new ConflictException("Khong du du lieu de auto compose hoa don. Hay tao hoa don thu cong.");

            var totalAmount = items.Sum(x => x.Quantity * x.UnitPrice);
            var invoice = InvoiceDomain.Create(
                appointmentId: appointment.Id,
                clinicId: request.ClinicId,
                totalAmount: totalAmount,
                discountAmount: request.Payload.DiscountAmount,
                examinationId: examination?.Id,
                notes: request.Payload.Notes);

            var finalizedItems = items.Select(x => InvoiceItemDomain.Create(
                invoiceId: invoice.Id,
                itemType: x.ItemType,
                description: x.Description,
                quantity: x.Quantity,
                unitPrice: x.UnitPrice,
                serviceId: x.ServiceId,
                inventoryItemId: x.InventoryItemId)).ToList();

            await _invoiceRepository.AddAsync(invoice);
            await _invoiceRepository.AddItemsAsync(finalizedItems);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return invoice.ToResponse(finalizedItems);
        }

        private async Task<MedicalExaminationDomain?> ResolveExaminationAsync(
            AutoComposeInvoiceCommand request,
            Guid appointmentId)
        {
            MedicalExaminationDomain? examination;
            if (request.Payload.ExaminationId.HasValue)
            {
                examination = await _medicalExaminationRepository.GetByIdAsync(request.Payload.ExaminationId.Value);
                if (examination == null)
                    throw new NotFoundException($"Khong tim thay phieu kham ID {request.Payload.ExaminationId.Value}");

                if (examination.AppointmentId != appointmentId)
                    throw new ConflictException("Phieu kham khong thuoc lich hen dang tao hoa don.");
            }
            else
            {
                examination = await _medicalExaminationRepository.GetByAppointmentIdAsync(appointmentId);
            }

            return examination;
        }

        private async Task<List<(InvoiceItemType ItemType, string Description, int Quantity, decimal UnitPrice, Guid? ServiceId, Guid? InventoryItemId)>> ComposeInvoiceItemsAsync(
            AutoComposeInvoiceCommand request,
            AppointmentDomain appointment,
            MedicalExaminationDomain? examination)
        {
            var items = new List<(InvoiceItemType ItemType, string Description, int Quantity, decimal UnitPrice, Guid? ServiceId, Guid? InventoryItemId)>();

            if (request.Payload.IncludeService && appointment.ServiceId.HasValue)
            {
                var service = await _clinicServiceRepository.GetByIdAsync(appointment.ServiceId.Value);
                if (service != null && service.ClinicId == request.ClinicId)
                {
                    items.Add((
                        InvoiceItemType.Service,
                        service.ServiceName,
                        1,
                        service.Price,
                        service.Id,
                        null));
                }
            }

            if (!request.Payload.IncludePrescriptions || examination == null)
            {
                return items;
            }

            var prescriptions = (await _prescriptionRepository.GetByExaminationIdAsync(examination.Id)).ToList();
            if (prescriptions.Count == 0)
            {
                return items;
            }

            var inventoryPriceCache = new Dictionary<Guid, decimal?>();
            foreach (var prescription in prescriptions)
            {
                var unitPrice = await ResolveUnitPriceAsync(request.ClinicId, prescription.InventoryItemId, inventoryPriceCache);
                var description = BuildMedicationDescription(prescription);

                items.Add((
                    InvoiceItemType.Medication,
                    description,
                    1,
                    unitPrice ?? 0,
                    null,
                    prescription.InventoryItemId));
            }

            return items;
        }

        private async Task<decimal?> ResolveUnitPriceAsync(
            Guid clinicId,
            Guid? inventoryItemId,
            IDictionary<Guid, decimal?> cache)
        {
            if (!inventoryItemId.HasValue)
            {
                return null;
            }

            if (cache.TryGetValue(inventoryItemId.Value, out var cachedValue))
            {
                return cachedValue;
            }

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
    }
}
