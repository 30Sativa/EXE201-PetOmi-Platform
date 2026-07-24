using System;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public class ChatSubscriptionVoucher
{
    public Guid VoucherId { get; set; }
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string DiscountType { get; set; } = null!;
    public decimal DiscountValue { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public decimal MinOrderAmount { get; set; }
    public int? UsageLimit { get; set; }
    public int UsedCount { get; set; }
    public DateTime? StartsAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool IsActive { get; set; }
    public Guid? CreatedByAdminId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public virtual User? CreatedByAdmin { get; set; }
    public virtual ICollection<ChatSubscriptionPayment> ChatSubscriptionPayments { get; set; } = new List<ChatSubscriptionPayment>();
}
