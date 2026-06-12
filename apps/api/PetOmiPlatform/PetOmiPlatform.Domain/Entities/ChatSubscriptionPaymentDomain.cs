using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Exceptions;

namespace PetOmiPlatform.Domain.Entities;

public class ChatSubscriptionPaymentDomain : BaseEntity
{
    public Guid? SubscriptionId { get; private set; }
    public Guid PlanId { get; private set; }
    public Guid OwnerUserId { get; private set; }
    public Guid PetId { get; private set; }
    public ChatSubscriptionPaymentStatus Status { get; private set; }
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
    public string? RawPayload { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    private ChatSubscriptionPaymentDomain() { }

    public static ChatSubscriptionPaymentDomain CreatePending(
        Guid planId,
        Guid ownerUserId,
        Guid petId,
        decimal amount,
        string paymentReference,
        string qrCodeUrl,
        string bankAccountNo,
        string bankCode,
        DateTime expiresAtUtc)
    {
        if (planId == Guid.Empty)
            throw new DomainException("Goi chat khong hop le.");
        if (ownerUserId == Guid.Empty)
            throw new DomainException("Owner khong hop le.");
        if (petId == Guid.Empty)
            throw new DomainException("Thu cung khong hop le.");
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
            Amount = amount,
            Currency = "VND",
            Provider = PaymentProvider.SePay,
            PaymentReference = paymentReference.Trim().ToUpperInvariant(),
            QrCodeUrl = qrCodeUrl,
            BankAccountNo = bankAccountNo.Trim(),
            BankCode = bankCode.Trim().ToUpperInvariant(),
            ExpiresAt = expiresAtUtc,
            CreatedAt = DateTime.UtcNow
        };
    }

    public static ChatSubscriptionPaymentDomain Reconstitute(
        Guid id,
        Guid? subscriptionId,
        Guid planId,
        Guid ownerUserId,
        Guid petId,
        ChatSubscriptionPaymentStatus status,
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
        PaidAt = paidAtUtc;
        RawPayload = rawPayload;
        UpdatedAt = paidAtUtc;
    }

    public void MarkExpired(DateTime utcNow)
    {
        if (Status != ChatSubscriptionPaymentStatus.Pending || ExpiresAt > utcNow)
            return;

        Status = ChatSubscriptionPaymentStatus.Expired;
        UpdatedAt = utcNow;
    }

    public void Cancel(DateTime utcNow)
    {
        if (Status != ChatSubscriptionPaymentStatus.Pending)
            return;

        Status = ChatSubscriptionPaymentStatus.Cancelled;
        UpdatedAt = utcNow;
    }
}
