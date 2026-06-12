using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Response;
using PetOmiPlatform.Application.Features.Invoice.Query;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Invoice.Handler
{
    public class GetSePayPaymentStatusQueryHandler : IRequestHandler<GetSePayPaymentStatusQuery, SePayPaymentStatusResponse>
    {
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IInvoiceRepository _invoiceRepository;
        private readonly IPaymentTransactionRepository _paymentTransactionRepository;

        public GetSePayPaymentStatusQueryHandler(
            IVetClinicRepository vetClinicRepository,
            IInvoiceRepository invoiceRepository,
            IPaymentTransactionRepository paymentTransactionRepository)
        {
            _vetClinicRepository = vetClinicRepository;
            _invoiceRepository = invoiceRepository;
            _paymentTransactionRepository = paymentTransactionRepository;
        }

        public async Task<SePayPaymentStatusResponse> Handle(GetSePayPaymentStatusQuery request, CancellationToken cancellationToken)
        {
            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(request.StaffUserId, request.ClinicId);
            ClinicRoleGuard.RequireInvoiceViewer(staff);

            var invoice = await _invoiceRepository.GetByIdAsync(request.InvoiceId)
                ?? throw new NotFoundException($"Không tìm thấy hóa đơn ID {request.InvoiceId}");

            if (invoice.ClinicId != request.ClinicId)
                throw new ForbiddenException("Không có quyền xem trạng thái thanh toán của hóa đơn này.");

            if (invoice.Status == InvoiceStatus.Paid)
            {
                return BuildResponse(
                    invoice,
                    "Paid",
                    "Thanh toán thành công.",
                    isFinal: true);
            }

            var transactions = await _paymentTransactionRepository.GetRecentByInvoiceOrPaymentReferenceAsync(
                request.ClinicId,
                invoice.Id,
                invoice.PaymentReference,
                limit: 5);

            var latest = transactions.FirstOrDefault();
            if (latest == null)
            {
                return BuildResponse(
                    invoice,
                    "Pending",
                    "Đang chờ thanh toán.",
                    isFinal: false);
            }

            if (latest.InvoiceId == invoice.Id && latest.TransferAmount < invoice.FinalAmount)
            {
                return BuildResponse(
                    invoice,
                    "AmountMismatch",
                    "Sai số tiền / cần đối soát.",
                    isFinal: false,
                    latest);
            }

            return BuildResponse(
                invoice,
                "ReceivedUnmatched",
                "Giao dịch đã nhận nhưng chưa khớp hóa đơn.",
                isFinal: false,
                latest);
        }

        private static SePayPaymentStatusResponse BuildResponse(
            InvoiceDomain invoice,
            string status,
            string message,
            bool isFinal,
            PaymentTransactionDomain? transaction = null)
        {
            return new SePayPaymentStatusResponse
            {
                InvoiceId = invoice.Id,
                InvoiceCode = invoice.InvoiceCode,
                PaymentReference = invoice.PaymentReference,
                Status = status,
                Message = message,
                IsFinal = isFinal,
                FinalAmount = invoice.FinalAmount,
                PaidAmount = invoice.PaidAmount,
                ReceivedAmount = transaction?.TransferAmount,
                PaymentTransactionId = transaction?.Id,
                ProviderTransactionId = transaction?.ProviderTransactionId,
                TransferContent = transaction?.TransferContent,
                TransactionDate = transaction?.TransactionDate
            };
        }
    }
}
