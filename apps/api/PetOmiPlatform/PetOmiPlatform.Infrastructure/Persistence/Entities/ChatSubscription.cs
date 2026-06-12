using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public class ChatSubscription
{
    public Guid SubscriptionId { get; set; }
    public string ScopeType { get; set; } = null!;
    public Guid? OwnerUserId { get; set; }
    public Guid? PetId { get; set; }
    public Guid? ClinicId { get; set; }
    public Guid PlanId { get; set; }
    public string Status { get; set; } = null!;
    public DateTime StartsAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public virtual User? OwnerUser { get; set; }
    public virtual Pet? Pet { get; set; }
    public virtual Clinic? Clinic { get; set; }
    public virtual ChatSubscriptionPlan Plan { get; set; } = null!;
    public virtual ICollection<ChatSubscriptionPayment> ChatSubscriptionPayments { get; set; } = new List<ChatSubscriptionPayment>();
}
