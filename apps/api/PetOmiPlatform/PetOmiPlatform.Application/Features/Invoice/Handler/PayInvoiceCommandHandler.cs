using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Features.Invoice.Command;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Invoice.Handler
{
    public class PayInvoiceCommandHandler : IRequestHandler<PayInvoiceCommand, bool>
    {
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IInventoryRepository _inventoryRepository;
        private readonly IInvoiceRepository _invoiceRepository;
        private readonly IOrderRepository _orderRepository;
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IUnitOfWork _unitOfWork;

        public PayInvoiceCommandHandler(
            IAppointmentRepository appointmentRepository,
            IInventoryRepository inventoryRepository,
            IInvoiceRepository invoiceRepository,
            IOrderRepository orderRepository,
            IVetClinicRepository vetClinicRepository,
            IUnitOfWork unitOfWork)
        {
            _appointmentRepository = appointmentRepository;
            _inventoryRepository = inventoryRepository;
            _invoiceRepository = invoiceRepository;
            _orderRepository = orderRepository;
            _vetClinicRepository = vetClinicRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<bool> Handle(PayInvoiceCommand request, CancellationToken cancellationToken)
        {
            var invoice = await _invoiceRepository.GetByIdAsync(request.InvoiceId);
            if (invoice == null)
                throw new NotFoundException("Invoice", request.InvoiceId);

            if (invoice.ClinicId != request.ClinicId)
                throw new ForbiddenException("Khong co quyen thanh toan hoa don nay.");

            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(request.StaffUserId, request.ClinicId);
            ClinicRoleGuard.RequireInvoiceWriter(staff);

            var paymentMethod = Enum.Parse<PaymentMethod>(request.Payload.PaymentMethod, ignoreCase: true);
            invoice.Pay(paymentMethod, request.Payload.PaidAmount);

            await ApplyPostPaymentSideEffectsAsync(invoice);
            await _invoiceRepository.UpdateAsync(invoice);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return true;
        }

        private async Task ApplyPostPaymentSideEffectsAsync(Domain.Entities.InvoiceDomain invoice)
        {
            var invoiceItems = (await _invoiceRepository.GetItemsByInvoiceIdAsync(invoice.Id)).ToList();
            foreach (var item in invoiceItems.Where(x => x.InventoryItemId.HasValue))
            {
                var inventory = await _inventoryRepository.GetByIdAsync(item.InventoryItemId!.Value)
                    ?? throw new NotFoundException("InventoryItem", item.InventoryItemId.Value);
                if (inventory.ClinicId != invoice.ClinicId)
                    throw new ForbiddenException("Hoa don co mat hang khong thuoc phong kham.");

                inventory.StockOut(item.Quantity);
                await _inventoryRepository.UpdateAsync(inventory);
            }

            if (invoice.OrderId.HasValue)
            {
                var order = await _orderRepository.GetByIdAsync(invoice.OrderId.Value)
                    ?? throw new NotFoundException("Order", invoice.OrderId.Value);
                if (order.ClinicId != invoice.ClinicId)
                    throw new ForbiddenException("Hoa don gan voi order khong thuoc phong kham.");

                order.MarkPaid();
                await _orderRepository.UpdateAsync(order);
            }

            if (invoice.AppointmentId.HasValue)
            {
                var appointment = await _appointmentRepository.GetByIdAsync(invoice.AppointmentId.Value)
                    ?? throw new NotFoundException("Appointment", invoice.AppointmentId.Value);
                if (appointment.ClinicId != invoice.ClinicId)
                    throw new ForbiddenException("Hoa don gan voi appointment khong thuoc phong kham.");

                if (appointment.Status == AppointmentStatus.CheckedIn)
                {
                    appointment.Complete();
                    await _appointmentRepository.UpdateAsync(appointment);
                }
            }
        }
    }
}
