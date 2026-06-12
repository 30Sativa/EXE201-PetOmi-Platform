using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public class ChatSubscriptionPlan
{
    public Guid PlanId { get; set; }
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public decimal PriceMonthly { get; set; }
    public int BillingCycleDays { get; set; }
    public int MonthlyMessageQuota { get; set; }
    public int? MonthlyTokenQuota { get; set; }
    public int PriorityLevel { get; set; }
    public bool DeepRagEnabled { get; set; }
    public bool ImageUploadEnabled { get; set; }
    public int MaxImageUploadsPerMonth { get; set; }
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<ChatSubscription> ChatSubscriptions { get; set; } = new List<ChatSubscription>();
    public virtual ICollection<ChatSubscriptionPayment> ChatSubscriptionPayments { get; set; } = new List<ChatSubscriptionPayment>();
}
