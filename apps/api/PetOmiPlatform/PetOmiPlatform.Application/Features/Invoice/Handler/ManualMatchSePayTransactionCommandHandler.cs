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
                throw new NotFoundException($"Khong tim thay giao dich SePay ID {request.PaymentTransactionId}");

            if (transaction.ClinicId != request.ClinicId)
                throw new ForbiddenException("Khong co quyen thao tac giao dich SePay nay.");

            if (transaction.IsMatched)
                throw new ConflictException("Giao dich SePay nay da duoc xu ly.");

            var invoice = await _invoiceRepository.GetByIdAsync(request.InvoiceId);
            if (invoice == null)
                throw new NotFoundException($"Khong tim thay hoa don ID {request.InvoiceId}");

            if (invoice.ClinicId != request.ClinicId)
                throw new ForbiddenException("Khong co quyen thao tac hoa don nay.");

            if (transaction.TransferType != "in")
                throw new ConflictException("Chi giao dich tien vao moi co the match voi hoa don.");

            if (transaction.TransferAmount < invoice.FinalAmount)
                throw new ConflictException("So tien giao dich nho hon gia tri hoa don, khong the match.");

            if (invoice.Status == InvoiceStatus.Cancelled)
                throw new ConflictException("Hoa don da huy, khong the match giao dich.");

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
