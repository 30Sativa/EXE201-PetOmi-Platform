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
                throw new NotFoundException($"Không tìm thấy hóa đơn ID {request.InvoiceId}");

            if (invoice.ClinicId != request.ClinicId)
                throw new ForbiddenException("Không có quyền tạo yêu cầu SePay cho hóa đơn này.");

            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(request.StaffUserId, request.ClinicId);
            ClinicRoleGuard.RequireInvoiceWriter(staff);

            var account = await _clinicPaymentAccountRepository.GetActiveByClinicIdAndProviderAsync(
                request.ClinicId,
                PaymentProvider.SePay);

            if (account == null)
                throw new ConflictException("Phòng khám chưa cấu hình tài khoản SePay active.");

            var paymentReference = await ResolvePaymentReferenceAsync(
                request.Payload.PaymentReference,
                invoice.PaymentReference);

            if (!_sePayService.IsValidPaymentReference(paymentReference))
                throw new BadRequestException("Payment reference phai dung cau truc SePay, vi du POM12345678.");

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

        private async Task<string> GenerateUniquePaymentReferenceAsync()
        {
            for (var attempt = 0; attempt < 5; attempt++)
            {
                var paymentReference = _sePayService.GeneratePaymentReference();
                var existed = await _invoiceRepository.GetByPaymentReferenceAsync(paymentReference);
                if (existed == null)
                {
                    return paymentReference;
                }
            }

            throw new ConflictException("Không thể tạo payment reference SePay duy nhất. Vui lòng thử lại.");
        }

        private async Task<string> ResolvePaymentReferenceAsync(string? requestedReference, string? existingReference)
        {
            if (!string.IsNullOrWhiteSpace(requestedReference))
            {
                return requestedReference.Trim().ToUpperInvariant();
            }

            if (!string.IsNullOrWhiteSpace(existingReference) &&
                _sePayService.IsValidPaymentReference(existingReference))
            {
                return existingReference.Trim().ToUpperInvariant();
            }

            return await GenerateUniquePaymentReferenceAsync();
        }
    }
}
