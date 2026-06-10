using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Features.Invoice.Command;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Invoice.Handler
{
    public class ConfirmManualRefundCommandHandler : IRequestHandler<ConfirmManualRefundCommand, bool>
    {
        private readonly IInvoiceRepository _invoiceRepository;
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IUnitOfWork _unitOfWork;

        public ConfirmManualRefundCommandHandler(
            IInvoiceRepository invoiceRepository,
            IVetClinicRepository vetClinicRepository,
            IUnitOfWork unitOfWork)
        {
            _invoiceRepository = invoiceRepository;
            _vetClinicRepository = vetClinicRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<bool> Handle(ConfirmManualRefundCommand request, CancellationToken cancellationToken)
        {
            var invoice = await _invoiceRepository.GetByIdAsync(request.InvoiceId);
            if (invoice == null)
                throw new NotFoundException($"Không tìm thấy hóa đơn ID {request.InvoiceId}");

            if (invoice.ClinicId != request.ClinicId)
                throw new ForbiddenException("Không có quyền xác nhận hoàn tiền cho hóa đơn này.");

            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(request.StaffUserId, request.ClinicId);
            ClinicRoleGuard.RequireInvoiceWriter(staff);

            invoice.ConfirmManualRefund(request.StaffUserId, request.RefundNote);

            await _invoiceRepository.UpdateAsync(invoice);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return true;
        }
    }
}
