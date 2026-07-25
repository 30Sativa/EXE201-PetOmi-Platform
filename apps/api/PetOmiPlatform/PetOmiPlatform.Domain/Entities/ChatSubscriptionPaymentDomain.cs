using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Exceptions;

namespace PetOmiPlatform.Domain.Entities;

public class ChatSubscriptionPaymentDomain : BaseEntity
{
    public Guid? SubscriptionId { get; private set; }
    public Guid PlanId { get; private set; }
    public Guid OwnerUserId { get; private set; }
    public Guid? PetId { get; private set; }
    public ChatSubscriptionPaymentStatus Status { get; private set; }
    public decimal OriginalAmount { get; private set; }
    public decimal DiscountAmount { get; private set; }
    public Guid? VoucherId { get; private set; }
    public string? VoucherCode { get; private set; }
    public decimal Amount { get; private set; }
    public string Currency { get; private set; } = "VND";
    public PaymentProvider Provider { get; private set; }
    public string PaymentReference { get; private set; } = string.Empty;
    public string? ProviderTransactionId { get; private set; }
    public string QrCodeUrl { get; private set; } = string.Empty;
    public string BankAccountNo { get; private set; } = string.Empty;
    public string BankCode { get; private set; } = string.Empty;
    public DateTime? PaidAt { get; private set; }
    public DateTime ExpiresAt { get; private set; }
    public bool IsOpen { get; private set; }
    public bool HasVoucherReservation { get; private set; }
    public string? RawPayload { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    private ChatSubscriptionPaymentDomain() { }

    public static ChatSubscriptionPaymentDomain CreatePending(
        Guid planId,
        Guid ownerUserId,
        Guid? petId,
        decimal originalAmount,
        decimal discountAmount,
        Guid? voucherId,
        string? voucherCode,
        decimal amount,
        string paymentReference,
        string qrCodeUrl,
        string bankAccountNo,
        string bankCode,
        DateTime expiresAtUtc,
        bool hasVoucherReservation)
    {
        if (planId == Guid.Empty)
            throw new DomainException("Goi chat khong hop le.");
        if (ownerUserId == Guid.Empty)
            throw new DomainException("Owner khong hop le.");
        if (petId.HasValue && petId.Value == Guid.Empty)
            throw new DomainException("Thu cung khong hop le.");
        if (originalAmount <= 0)
            throw new DomainException("Gia goc thanh toan phai lon hon 0.");
        if (discountAmount < 0 || discountAmount >= originalAmount)
            throw new DomainException("So tien giam gia khong hop le.");
        if (amount <= 0)
            throw new DomainException("So tien thanh toan phai lon hon 0.");
        if (string.IsNullOrWhiteSpace(paymentReference))
            throw new DomainException("Payment reference khong hop le.");
        if (string.IsNullOrWhiteSpace(qrCodeUrl))
            throw new DomainException("QR thanh toan khong hop le.");
        if (string.IsNullOrWhiteSpace(bankAccountNo) || string.IsNullOrWhiteSpace(bankCode))
            throw new DomainException("Tai khoan nhan tien khong hop le.");

        return new ChatSubscriptionPaymentDomain
        {
            Id = Guid.NewGuid(),
            SubscriptionId = null,
            PlanId = planId,
            OwnerUserId = ownerUserId,
            PetId = petId,
            Status = ChatSubscriptionPaymentStatus.Pending,
            OriginalAmount = originalAmount,
            DiscountAmount = discountAmount,
            VoucherId = voucherId,
            VoucherCode = string.IsNullOrWhiteSpace(voucherCode) ? null : voucherCode.Trim().ToUpperInvariant(),
            Amount = amount,
            Currency = "VND",
            Provider = PaymentProvider.SePay,
            PaymentReference = paymentReference.Trim().ToUpperInvariant(),
            QrCodeUrl = qrCodeUrl,
            BankAccountNo = bankAccountNo.Trim(),
            BankCode = bankCode.Trim().ToUpperInvariant(),
            ExpiresAt = expiresAtUtc,
            IsOpen = true,
            HasVoucherReservation = hasVoucherReservation,
            CreatedAt = DateTime.UtcNow
        };
    }

    public static ChatSubscriptionPaymentDomain CreateComplimentaryPaid(
        Guid subscriptionId,
        Guid planId,
        Guid ownerUserId,
        Guid? petId,
        decimal originalAmount,
        decimal discountAmount,
        Guid voucherId,
        string voucherCode,
        string paymentReference,
        DateTime paidAtUtc)
    {
        if (subscriptionId == Guid.Empty || planId == Guid.Empty || ownerUserId == Guid.Empty || voucherId == Guid.Empty)
            throw new DomainException("Thong tin uu dai mien phi khong hop le.");
        if (originalAmount <= 0 || discountAmount != originalAmount)
            throw new DomainException("Thanh toan mien phi phai giam dung toan bo gia goi.");
        if (string.IsNullOrWhiteSpace(voucherCode) || string.IsNullOrWhiteSpace(paymentReference))
            throw new DomainException("Thong tin voucher mien phi khong hop le.");

        return new ChatSubscriptionPaymentDomain
        {
            Id = Guid.NewGuid(),
            SubscriptionId = subscriptionId,
            PlanId = planId,
            OwnerUserId = ownerUserId,
            PetId = petId,
            Status = ChatSubscriptionPaymentStatus.Paid,
            OriginalAmount = originalAmount,
            DiscountAmount = discountAmount,
            VoucherId = voucherId,
            VoucherCode = voucherCode.Trim().ToUpperInvariant(),
            Amount = 0,
            Currency = "VND",
            Provider = PaymentProvider.Manual,
            PaymentReference = paymentReference.Trim().ToUpperInvariant(),
            QrCodeUrl = string.Empty,
            BankAccountNo = string.Empty,
            BankCode = string.Empty,
            PaidAt = paidAtUtc,
            ExpiresAt = paidAtUtc,
            IsOpen = false,
            HasVoucherReservation = false,
            CreatedAt = paidAtUtc
        };
    }

    public static ChatSubscriptionPaymentDomain Reconstitute(
        Guid id,
        Guid? subscriptionId,
        Guid planId,
        Guid ownerUserId,
        Guid? petId,
        ChatSubscriptionPaymentStatus status,
        decimal originalAmount,
        decimal discountAmount,
        Guid? voucherId,
        string? voucherCode,
        decimal amount,
        string currency,
        PaymentProvider provider,
        string paymentReference,
        string? providerTransactionId,
        string qrCodeUrl,
        string bankAccountNo,
        string bankCode,
        DateTime? paidAt,
        DateTime expiresAt,
        bool isOpen,
        bool hasVoucherReservation,
        string? rawPayload,
        DateTime createdAt,
        DateTime? updatedAt)
    {
        return new ChatSubscriptionPaymentDomain
        {
            Id = id,
            SubscriptionId = subscriptionId,
            PlanId = planId,
            OwnerUserId = ownerUserId,
            PetId = petId,
            Status = status,
            OriginalAmount = originalAmount,
            DiscountAmount = discountAmount,
            VoucherId = voucherId,
            VoucherCode = voucherCode,
            Amount = amount,
            Currency = currency,
            Provider = provider,
            PaymentReference = paymentReference,
            ProviderTransactionId = providerTransactionId,
            QrCodeUrl = qrCodeUrl,
            BankAccountNo = bankAccountNo,
            BankCode = bankCode,
            PaidAt = paidAt,
            ExpiresAt = expiresAt,
            IsOpen = isOpen,
            HasVoucherReservation = hasVoucherReservation,
            RawPayload = rawPayload,
            CreatedAt = createdAt,
            UpdatedAt = updatedAt
        };
    }

    public bool CanBePaid(DateTime utcNow)
    {
        return Status == ChatSubscriptionPaymentStatus.Pending && ExpiresAt > utcNow;
    }

    public void MarkPaid(Guid subscriptionId, string providerTransactionId, DateTime paidAtUtc, string? rawPayload)
    {
        if (Status == ChatSubscriptionPaymentStatus.Paid)
            return;
        if (subscriptionId == Guid.Empty)
            throw new DomainException("Subscription khong hop le.");
        if (string.IsNullOrWhiteSpace(providerTransactionId))
            throw new DomainException("Ma giao dich provider khong hop le.");

        SubscriptionId = subscriptionId;
        ProviderTransactionId = providerTransactionId.Trim();
        Status = ChatSubscriptionPaymentStatus.Paid;
        IsOpen = false;
        PaidAt = paidAtUtc;
        RawPayload = rawPayload;
        UpdatedAt = paidAtUtc;
    }

    public bool MarkExpired(DateTime utcNow)
    {
        if (Status != ChatSubscriptionPaymentStatus.Pending || ExpiresAt > utcNow)
            return false;

        Status = ChatSubscriptionPaymentStatus.Expired;
        IsOpen = false;
        UpdatedAt = utcNow;
        return true;
    }

    public void Cancel(DateTime utcNow)
    {
        if (Status != ChatSubscriptionPaymentStatus.Pending)
            return;

        Status = ChatSubscriptionPaymentStatus.Cancelled;
        IsOpen = false;
        UpdatedAt = utcNow;
    }

    public bool ReleaseVoucherReservation(DateTime utcNow)
    {
        if (!HasVoucherReservation)
            return false;

        HasVoucherReservation = false;
        UpdatedAt = utcNow;
        return true;
    }
}
