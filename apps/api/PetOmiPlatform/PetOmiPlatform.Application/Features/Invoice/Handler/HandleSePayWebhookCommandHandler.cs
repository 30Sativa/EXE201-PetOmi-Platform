using System.Globalization;
using System.Text.RegularExpressions;
using MediatR;
using PetOmiPlatform.Application.Features.Invoice.Command;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Invoice.Handler
{
    public class HandleSePayWebhookCommandHandler : IRequestHandler<HandleSePayWebhookCommand, bool>
    {
        private static readonly Regex InvoiceCodeRegex = new(@"INV\d{6}[A-Z0-9]{8}", RegexOptions.Compiled);

        private readonly IClinicPaymentAccountRepository _clinicPaymentAccountRepository;
        private readonly IInvoiceRepository _invoiceRepository;
        private readonly IPaymentTransactionRepository _paymentTransactionRepository;
        private readonly IUnitOfWork _unitOfWork;

        public HandleSePayWebhookCommandHandler(
            IClinicPaymentAccountRepository clinicPaymentAccountRepository,
            IInvoiceRepository invoiceRepository,
            IPaymentTransactionRepository paymentTransactionRepository,
            IUnitOfWork unitOfWork)
        {
            _clinicPaymentAccountRepository = clinicPaymentAccountRepository;
            _invoiceRepository = invoiceRepository;
            _paymentTransactionRepository = paymentTransactionRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<bool> Handle(HandleSePayWebhookCommand request, CancellationToken cancellationToken)
        {
            var transactionId = request.Payload.Id.ToString(CultureInfo.InvariantCulture);
            var existed = await _paymentTransactionRepository.ExistsByProviderTransactionIdAsync(PaymentProvider.SePay, transactionId);
            if (existed)
            {
                return true;
            }

            var clinicPaymentAccount = await _clinicPaymentAccountRepository.GetActiveByProviderAndAccountNumberAsync(
                PaymentProvider.SePay,
                request.Payload.AccountNumber);

            if (clinicPaymentAccount == null)
            {
                return true;
            }

            var invoice = await ResolveInvoiceAsync(request.Payload.Code, request.Payload.Content);
            var parsedTransactionDateUtc = ParseVietnamTimeToUtc(request.Payload.TransactionDate);

            var paymentTransaction = PaymentTransactionDomain.Create(
                clinicId: clinicPaymentAccount.ClinicId,
                provider: PaymentProvider.SePay,
                providerTransactionId: transactionId,
                transferType: request.Payload.TransferType,
                transferAmount: request.Payload.TransferAmount,
                referenceCode: request.Payload.ReferenceCode,
                transferContent: request.Payload.Content,
                gateway: request.Payload.Gateway,
                accountNumber: request.Payload.AccountNumber,
                transactionDate: parsedTransactionDateUtc,
                rawPayload: request.RawPayload);

            if (invoice != null &&
                invoice.ClinicId == clinicPaymentAccount.ClinicId &&
                request.Payload.TransferType == "in")
            {
                invoice.MarkPaidBySePay(request.Payload.TransferAmount, DateTime.UtcNow);
                await _invoiceRepository.UpdateAsync(invoice);

                if (invoice.Status == InvoiceStatus.Paid)
                {
                    paymentTransaction.MarkMatched(invoice.Id);
                }
            }

            await _paymentTransactionRepository.AddAsync(paymentTransaction);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return true;
        }

        private async Task<InvoiceDomain?> ResolveInvoiceAsync(string? code, string content)
        {
            if (!string.IsNullOrWhiteSpace(code))
            {
                var byReference = await _invoiceRepository.GetByPaymentReferenceAsync(code);
                if (byReference != null)
                {
                    return byReference;
                }

                var byCode = await _invoiceRepository.GetByInvoiceCodeAsync(code);
                if (byCode != null)
                {
                    return byCode;
                }
            }

            var matched = InvoiceCodeRegex.Match(content ?? string.Empty);
            if (!matched.Success)
            {
                return null;
            }

            return await _invoiceRepository.GetByInvoiceCodeAsync(matched.Value);
        }

        private static DateTime? ParseVietnamTimeToUtc(string transactionDate)
        {
            if (string.IsNullOrWhiteSpace(transactionDate))
            {
                return null;
            }

            if (!DateTime.TryParseExact(
                    transactionDate,
                    "yyyy-MM-dd HH:mm:ss",
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.None,
                    out var localTime))
            {
                return null;
            }

            var vietnamTimeZone = ResolveVietnamTimeZone();
            return TimeZoneInfo.ConvertTimeToUtc(localTime, vietnamTimeZone);
        }

        private static TimeZoneInfo ResolveVietnamTimeZone()
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            }
            catch (TimeZoneNotFoundException)
            {
                return TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
            }
        }
    }
}
