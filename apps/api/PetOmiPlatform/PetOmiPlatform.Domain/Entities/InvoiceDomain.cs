using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Exceptions;
using PaymentMethodEnum = PetOmiPlatform.Domain.Common.Enums.PaymentMethod;

namespace PetOmiPlatform.Domain.Entities
{
    public class InvoiceDomain : BaseEntity
    {
        public Guid AppointmentId { get; private set; }
        public Guid? ExaminationId { get; private set; }
        public Guid ClinicId { get; private set; }
        public string InvoiceCode { get; private set; } = string.Empty;

        public decimal TotalAmount { get; private set; }
        public decimal DiscountAmount { get; private set; }
        public decimal FinalAmount { get; private set; }

        public InvoiceStatus Status { get; private set; }
        public PaymentProvider PaymentProvider { get; private set; }
        public string? PaymentReference { get; private set; }
        public string? QrCodeUrl { get; private set; }
        public string? BankAccountNo { get; private set; }
        public string? BankCode { get; private set; }
        public decimal? PaidAmount { get; private set; }
        public DateTime? PaymentWebhookAt { get; private set; }
        public PaymentMethodEnum? PaymentMethod { get; private set; }
        public string? Notes { get; private set; }

        public DateTime? PaidAt { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public DateTime? UpdatedAt { get; private set; }

        private InvoiceDomain() { }

        public static InvoiceDomain Create(
            Guid appointmentId,
            Guid clinicId,
            decimal totalAmount,
            decimal discountAmount = 0,
            Guid? examinationId = null,
            string? notes = null)
        {
            if (totalAmount < 0)
                throw new DomainException("Tong tien khong duoc am.");
            if (discountAmount < 0)
                throw new DomainException("Giam gia khong duoc am.");
            if (discountAmount > totalAmount)
                throw new DomainException("Giam gia khong duoc lon hon tong tien.");

            return new InvoiceDomain
            {
                Id = Guid.NewGuid(),
                AppointmentId = appointmentId,
                ExaminationId = examinationId,
                ClinicId = clinicId,
                InvoiceCode = GenerateInvoiceCode(),
                TotalAmount = totalAmount,
                DiscountAmount = discountAmount,
                FinalAmount = totalAmount - discountAmount,
                Status = InvoiceStatus.Unpaid,
                PaymentProvider = PaymentProvider.Manual,
                Notes = notes,
                CreatedAt = DateTime.UtcNow
            };
        }

        public static InvoiceDomain Reconstitute(
            Guid id,
            Guid appointmentId,
            Guid? examinationId,
            Guid clinicId,
            string invoiceCode,
            decimal totalAmount,
            decimal discountAmount,
            decimal finalAmount,
            InvoiceStatus status,
            PaymentProvider paymentProvider,
            string? paymentReference,
            string? qrCodeUrl,
            string? bankAccountNo,
            string? bankCode,
            decimal? paidAmount,
            DateTime? paymentWebhookAt,
            PaymentMethodEnum? paymentMethod,
            string? notes,
            DateTime? paidAt,
            DateTime createdAt,
            DateTime? updatedAt)
        {
            return new InvoiceDomain
            {
                Id = id,
                AppointmentId = appointmentId,
                ExaminationId = examinationId,
                ClinicId = clinicId,
                InvoiceCode = invoiceCode,
                TotalAmount = totalAmount,
                DiscountAmount = discountAmount,
                FinalAmount = finalAmount,
                Status = status,
                PaymentProvider = paymentProvider,
                PaymentReference = paymentReference,
                QrCodeUrl = qrCodeUrl,
                BankAccountNo = bankAccountNo,
                BankCode = bankCode,
                PaidAmount = paidAmount,
                PaymentWebhookAt = paymentWebhookAt,
                PaymentMethod = paymentMethod,
                Notes = notes,
                PaidAt = paidAt,
                CreatedAt = createdAt,
                UpdatedAt = updatedAt
            };
        }

        public void Pay(PaymentMethodEnum method, decimal? paidAmount = null)
        {
            if (Status != InvoiceStatus.Unpaid)
                throw new DomainException("Chi co the thanh toan hoa don chua thanh toan.");

            Status = InvoiceStatus.Paid;
            PaymentMethod = method;
            PaymentProvider = method == PaymentMethodEnum.SePayBankTransfer
                ? PaymentProvider.SePay
                : PaymentProvider.Manual;
            PaidAmount = paidAmount ?? FinalAmount;
            PaidAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }

        public void RequestSePayPayment(
            string paymentReference,
            string qrCodeUrl,
            string bankAccountNo,
            string bankCode)
        {
            if (Status != InvoiceStatus.Unpaid)
                throw new DomainException("Chi co the tao yeu cau SePay cho hoa don chua thanh toan.");
            if (string.IsNullOrWhiteSpace(paymentReference))
                throw new DomainException("Payment reference khong hop le.");
            if (string.IsNullOrWhiteSpace(qrCodeUrl))
                throw new DomainException("QR code URL khong hop le.");
            if (string.IsNullOrWhiteSpace(bankAccountNo))
                throw new DomainException("So tai khoan nhan tien khong hop le.");
            if (string.IsNullOrWhiteSpace(bankCode))
                throw new DomainException("Ma ngan hang khong hop le.");

            PaymentProvider = PaymentProvider.SePay;
            PaymentReference = paymentReference;
            QrCodeUrl = qrCodeUrl;
            BankAccountNo = bankAccountNo;
            BankCode = bankCode;
            UpdatedAt = DateTime.UtcNow;
        }

        public void MarkPaidBySePay(decimal paidAmount, DateTime webhookReceivedAtUtc)
        {
            if (Status == InvoiceStatus.Cancelled)
                throw new DomainException("Khong the ghi nhan thanh toan SePay cho hoa don da huy.");
            if (Status == InvoiceStatus.Paid)
                return;
            if (paidAmount < FinalAmount)
                return;

            PaymentWebhookAt = webhookReceivedAtUtc;
            Pay(PaymentMethodEnum.SePayBankTransfer, paidAmount);
        }

        public void Cancel()
        {
            if (Status == InvoiceStatus.Paid)
                throw new DomainException("Khong the huy hoa don da thanh toan.");
            if (Status == InvoiceStatus.Cancelled)
                throw new DomainException("Hoa don da duoc huy roi.");

            Status = InvoiceStatus.Cancelled;
            UpdatedAt = DateTime.UtcNow;
        }

        private static string GenerateInvoiceCode()
        {
            var code = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
            return $"INV{DateTime.UtcNow:yyMMdd}{code}";
        }
    }
}
