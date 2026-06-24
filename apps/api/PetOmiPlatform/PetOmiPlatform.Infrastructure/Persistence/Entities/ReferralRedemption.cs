using System;

namespace PetOmiPlatform.Infrastructure.Persistence.Entities;

public class ReferralRedemption
{
    public Guid RedemptionId { get; set; }
    public Guid ReferrerUserId { get; set; }
    public Guid NewUserId { get; set; }
    public string ReferralCode { get; set; } = null!;
    public int BonusMessages { get; set; }
    public DateTime CreatedAt { get; set; }
}
