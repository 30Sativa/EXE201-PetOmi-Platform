namespace PetOmiPlatform.Application.Features.Promotions.DTOs;

public class ReferralInfoResponse
{
    public string ReferralCode { get; set; } = string.Empty;
    public int SuccessfulReferrals { get; set; }
    public int TotalBonusMessages { get; set; }
    public int BonusPerReferral { get; set; }
    public bool ReferralEnabled { get; set; }
}

public class PromotionOffersResponse
{
    public bool TrialEnabled { get; set; }
    public int TrialDays { get; set; }
    public bool TrialAlreadyUsed { get; set; }

    public bool EarlyBirdEnabled { get; set; }
    public int EarlyBirdDiscountPercent { get; set; }
    public int EarlyBirdCycles { get; set; }
    public bool EarlyBirdEligible { get; set; }

    public bool ReferralEnabled { get; set; }
    public int ReferralBonusMessages { get; set; }
    public string ReferralCode { get; set; } = string.Empty;
}

public class ActivateTrialResponse
{
    public Guid SubscriptionId { get; set; }
    public System.DateTime ExpiresAt { get; set; }
    public int TrialDays { get; set; }
}
