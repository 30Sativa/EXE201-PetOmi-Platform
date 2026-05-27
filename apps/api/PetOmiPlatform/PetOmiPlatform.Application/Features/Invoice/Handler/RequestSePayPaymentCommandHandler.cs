using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Features.Invoice.Command;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Invoice.Handler
{
    public class RequestSePayPaymentCommandHandler : IRequestHandler<RequestSePayPaymentCommand, SePayPaymentRequestResponse>
    {
        private readonly IInvoiceRepository _invoiceRepository;
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IClinicPaymentAccountRepository _clinicPaymentAccountRepository;
        private readonly ISePayService _sePayService;
        private readonly IUnitOfWork _unitOfWork;

        public RequestSePayPaymentCommandHandler(
            IInvoiceRepository invoiceRepository,
            IVetClinicRepository vetClinicRepository,
            IClinicPaymentAccountRepository clinicPaymentAccountRepository,
            ISePayService sePayService,
            IUnitOfWork unitOfWork)
        {
            _invoiceRepository = invoiceRepository;
            _vetClinicRepository = vetClinicRepository;
            _clinicPaymentAccountRepository = clinicPaymentAccountRepository;
            _sePayService = sePayService;
            _unitOfWork = unitOfWork;
        }

        public async Task<SePayPaymentRequestResponse> Handle(RequestSePayPaymentCommand request, CancellationToken cancellationToken)
        {
            var invoice = await _invoiceRepository.GetByIdAsync(request.InvoiceId);
            if (invoice == null)
                throw new NotFoundException($"Khong tim thay hoa don ID {request.InvoiceId}");

            if (invoice.ClinicId != request.ClinicId)
                throw new ForbiddenException("Khong co quyen tao yeu cau SePay cho hoa don nay.");

            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(request.StaffUserId, request.ClinicId);
            ClinicRoleGuard.RequireInvoiceWriter(staff);

            var account = await _clinicPaymentAccountRepository.GetActiveByClinicIdAndProviderAsync(
                request.ClinicId,
                PaymentProvider.SePay);

            if (account == null)
                throw new ConflictException("Clinic chua cau hinh tai khoan SePay active.");

            var paymentReference = string.IsNullOrWhiteSpace(request.Payload.PaymentReference)
                ? invoice.InvoiceCode
                : request.Payload.PaymentReference.Trim();

            var qrCodeUrl = _sePayService.BuildQrImageUrl(
                account.AccountNumber,
                account.BankCode,
                invoice.FinalAmount,
                paymentReference);

            invoice.RequestSePayPayment(
                paymentReference: paymentReference,
                qrCodeUrl: qrCodeUrl,
                bankAccountNo: account.AccountNumber,
                bankCode: account.BankCode);

            await _invoiceRepository.UpdateAsync(invoice);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new SePayPaymentRequestResponse
            {
                InvoiceId = invoice.Id,
                InvoiceCode = invoice.InvoiceCode,
                PaymentReference = paymentReference,
                FinalAmount = invoice.FinalAmount,
                QrCodeUrl = qrCodeUrl,
                BankAccountNo = account.AccountNumber,
                BankCode = account.BankCode
            };
        }
    }
}
