using System;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public class ChatSubscriptionPayment
{
    public Guid PaymentId { get; set; }
    public Guid? SubscriptionId { get; set; }
    public Guid PlanId { get; set; }
    public Guid OwnerUserId { get; set; }
    public Guid PetId { get; set; }
    public string Status { get; set; } = null!;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = null!;
    public string Provider { get; set; } = null!;
    public string PaymentReference { get; set; } = null!;
    public string? ProviderTransactionId { get; set; }
    public string QrCodeUrl { get; set; } = null!;
    public string BankAccountNo { get; set; } = null!;
    public string BankCode { get; set; } = null!;
    public DateTime? PaidAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public string? RawPayload { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public virtual ChatSubscription? Subscription { get; set; }
    public virtual ChatSubscriptionPlan Plan { get; set; } = null!;
    public virtual User OwnerUser { get; set; } = null!;
    public virtual Pet Pet { get; set; } = null!;
}
