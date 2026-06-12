using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Features.Invoice.Command;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Invoice.Handler
{
    public class DismissSePayTransactionCommandHandler : IRequestHandler<DismissSePayTransactionCommand, bool>
    {
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IPaymentTransactionRepository _paymentTransactionRepository;
        private readonly IUnitOfWork _unitOfWork;

        public DismissSePayTransactionCommandHandler(
            IVetClinicRepository vetClinicRepository,
            IPaymentTransactionRepository paymentTransactionRepository,
            IUnitOfWork unitOfWork)
        {
            _vetClinicRepository = vetClinicRepository;
            _paymentTransactionRepository = paymentTransactionRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<bool> Handle(DismissSePayTransactionCommand request, CancellationToken cancellationToken)
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

            await _paymentTransactionRepository.MarkDismissedAsync(
                transaction.Id,
                request.StaffUserId,
                request.ReviewNote);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}
