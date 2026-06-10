using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Features.Invoice.Command;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Invoice.Handler
{
    public class ManualMatchSePayTransactionCommandHandler : IRequestHandler<ManualMatchSePayTransactionCommand, bool>
    {
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IPaymentTransactionRepository _paymentTransactionRepository;
        private readonly IInvoiceRepository _invoiceRepository;
        private readonly IUnitOfWork _unitOfWork;

        public ManualMatchSePayTransactionCommandHandler(
            IVetClinicRepository vetClinicRepository,
            IPaymentTransactionRepository paymentTransactionRepository,
            IInvoiceRepository invoiceRepository,
            IUnitOfWork unitOfWork)
        {
            _vetClinicRepository = vetClinicRepository;
            _paymentTransactionRepository = paymentTransactionRepository;
            _invoiceRepository = invoiceRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<bool> Handle(ManualMatchSePayTransactionCommand request, CancellationToken cancellationToken)
        {
            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(request.StaffUserId, request.ClinicId);
            ClinicRoleGuard.RequireInvoiceWriter(staff);

            var transaction = await _paymentTransactionRepository.GetByIdAsync(request.PaymentTransactionId);
            if (transaction == null)
                throw new NotFoundException($"Không tìm thấy giao dịch SePay ID {request.PaymentTransactionId}");

            if (transaction.ClinicId != request.ClinicId)
                throw new ForbiddenException("Không có quyền thao tác giao dịch SePay này.");

            if (transaction.IsMatched)
                throw new ConflictException("Giao dịch SePay này đã được xử lý.");

            var invoice = await _invoiceRepository.GetByIdAsync(request.InvoiceId);
            if (invoice == null)
                throw new NotFoundException($"Không tìm thấy hóa đơn ID {request.InvoiceId}");

            if (invoice.ClinicId != request.ClinicId)
                throw new ForbiddenException("Không có quyền thao tác hóa đơn này.");

            if (transaction.TransferType != "in")
                throw new ConflictException("Chỉ giao dịch tiền vào mới có thể khớp với hóa đơn.");

            if (transaction.TransferAmount < invoice.FinalAmount)
                throw new ConflictException("Số tiền giao dịch nhỏ hơn giá trị hóa đơn, không thể khớp.");

            if (invoice.Status == InvoiceStatus.Cancelled)
                throw new ConflictException("Hóa đơn đã hủy, không thể khớp giao dịch.");

            invoice.MarkPaidBySePay(transaction.TransferAmount, DateTime.UtcNow);
            await _invoiceRepository.UpdateAsync(invoice);
            await _paymentTransactionRepository.MarkMatchedAsync(
                transaction.Id,
                invoice.Id,
                request.StaffUserId,
                request.ReviewNote);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return true;
        }
    }
}
