using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Exceptions;
using PaymentMethodEnum = PetOmiPlatform.Domain.Common.Enums.PaymentMethod;

namespace PetOmiPlatform.Domain.Entities
{
    public class InvoiceDomain : BaseEntity
    {
        public Guid? AppointmentId { get; private set; }
        public Guid? OrderId { get; private set; }
        public Guid? ExaminationId { get; private set; }
        public Guid ClinicId { get; private set; }
        public string InvoiceCode { get; private set; } = string.Empty;
        public InvoiceSource InvoiceSource { get; private set; }

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
        public string? CancellationReason { get; private set; }
        public Guid? CancelledByUserId { get; private set; }
        public DateTime? CancelledAt { get; private set; }
        public bool RequiresManualRefund { get; private set; }
        public string? RefundNote { get; private set; }
        public Guid? RefundConfirmedByUserId { get; private set; }
        public DateTime? RefundConfirmedAt { get; private set; }
        public string? Notes { get; private set; }

        public DateTime? PaidAt { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public DateTime? UpdatedAt { get; private set; }

        private InvoiceDomain() { }

        public static InvoiceDomain Create(
            Guid? appointmentId,
            Guid clinicId,
            decimal totalAmount,
            decimal discountAmount = 0,
            Guid? examinationId = null,
            Guid? orderId = null,
            InvoiceSource? invoiceSource = null,
            string? notes = null)
        {
            if (!appointmentId.HasValue && !orderId.HasValue)
                throw new DomainException("Hoa don phai gan voi lich kham, don hang hoac ca hai.");
            if (totalAmount < 0)
                throw new DomainException("Tong tien khong duoc am.");
            if (discountAmount < 0)
                throw new DomainException("Giam gia khong duoc am.");
            if (discountAmount > totalAmount)
                throw new DomainException("Giam gia khong duoc lon hon tong tien.");

            var resolvedSource = invoiceSource ?? ResolveSource(appointmentId, orderId);
            ValidateSource(resolvedSource, appointmentId, orderId);

            return new InvoiceDomain
            {
                Id = Guid.NewGuid(),
                AppointmentId = appointmentId,
                OrderId = orderId,
                ExaminationId = examinationId,
                ClinicId = clinicId,
                InvoiceSource = resolvedSource,
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
            Guid? appointmentId,
            Guid? orderId,
            Guid? examinationId,
            Guid clinicId,
            InvoiceSource invoiceSource,
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
            string? cancellationReason,
            Guid? cancelledByUserId,
            DateTime? cancelledAt,
            bool requiresManualRefund,
            string? refundNote,
            Guid? refundConfirmedByUserId,
            DateTime? refundConfirmedAt,
            string? notes,
            DateTime? paidAt,
            DateTime createdAt,
            DateTime? updatedAt)
        {
            return new InvoiceDomain
            {
                Id = id,
                AppointmentId = appointmentId,
                OrderId = orderId,
                ExaminationId = examinationId,
                ClinicId = clinicId,
                InvoiceSource = invoiceSource,
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
                CancellationReason = cancellationReason,
                CancelledByUserId = cancelledByUserId,
                CancelledAt = cancelledAt,
                RequiresManualRefund = requiresManualRefund,
                RefundNote = refundNote,
                RefundConfirmedByUserId = refundConfirmedByUserId,
                RefundConfirmedAt = refundConfirmedAt,
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
            if (paidAmount.HasValue && paidAmount.Value <= 0)
                throw new DomainException("So tien thanh toan phai lon hon 0.");

            var actualPaidAmount = paidAmount ?? FinalAmount;
            if (actualPaidAmount < FinalAmount)
            {
                throw new DomainException("MVP hien tai chua ho tro thanh toan mot phan. Vui long thu du so tien hoa don.");
            }

            Status = InvoiceStatus.Paid;
            PaymentMethod = method;
            PaymentProvider = method == PaymentMethodEnum.SePayBankTransfer
                ? PaymentProvider.SePay
                : PaymentProvider.Manual;
            PaidAmount = actualPaidAmount;
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

        public void Cancel(Guid cancelledByUserId, string? cancellationReason = null)
        {
            if (Status == InvoiceStatus.Cancelled)
                throw new DomainException("Hoa don da duoc huy roi.");

            var wasPaid = Status == InvoiceStatus.Paid;
            if (wasPaid && string.IsNullOrWhiteSpace(cancellationReason))
            {
                throw new DomainException("Hoa don da thanh toan bat buoc phai co ly do huy de doi soat hoan tien thu cong.");
            }

            Status = InvoiceStatus.Cancelled;
            CancellationReason = string.IsNullOrWhiteSpace(cancellationReason)
                ? null
                : cancellationReason.Trim();
            CancelledByUserId = cancelledByUserId;
            CancelledAt = DateTime.UtcNow;
            RequiresManualRefund = wasPaid && PaidAmount.HasValue && PaidAmount.Value > 0;
            RefundNote = null;
            RefundConfirmedByUserId = null;
            RefundConfirmedAt = null;
            UpdatedAt = DateTime.UtcNow;
        }

        public void ConfirmManualRefund(Guid confirmedByUserId, string refundNote)
        {
            if (Status != InvoiceStatus.Cancelled)
                throw new DomainException("Chi xac nhan hoan tien thu cong cho hoa don da huy.");
            if (!RequiresManualRefund)
                throw new DomainException("Hoa don nay khong o trang thai can hoan tien thu cong.");
            if (RefundConfirmedAt.HasValue)
                throw new DomainException("Hoa don da duoc xac nhan hoan tien truoc do.");
            if (string.IsNullOrWhiteSpace(refundNote))
                throw new DomainException("Bat buoc nhap ghi chu xac nhan hoan tien.");

            RequiresManualRefund = false;
            RefundNote = refundNote.Trim();
            RefundConfirmedByUserId = confirmedByUserId;
            RefundConfirmedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }

        private static string GenerateInvoiceCode()
        {
            var code = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
            return $"INV{DateTime.UtcNow:yyMMdd}{code}";
        }

        private static InvoiceSource ResolveSource(Guid? appointmentId, Guid? orderId)
        {
            if (appointmentId.HasValue && orderId.HasValue)
                return InvoiceSource.Mixed;
            if (appointmentId.HasValue)
                return InvoiceSource.Appointment;
            return InvoiceSource.Order;
        }

        private static void ValidateSource(InvoiceSource source, Guid? appointmentId, Guid? orderId)
        {
            if (source == InvoiceSource.Appointment && !appointmentId.HasValue)
                throw new DomainException("Hoa don tu lich kham bat buoc co AppointmentId.");
            if (source == InvoiceSource.Order && !orderId.HasValue)
                throw new DomainException("Hoa don tu don hang bat buoc co OrderId.");
            if (source == InvoiceSource.Mixed && (!appointmentId.HasValue || !orderId.HasValue))
                throw new DomainException("Hoa don gop bat buoc co ca AppointmentId va OrderId.");
        }
    }
}
