namespace PetOmiPlatform.Application.Interfaces;

/// <summary>
/// Doc cau hinh 3 uu dai Premium tu SystemSetting (category 'Promotion').
/// Admin chinh duoc qua trang Cai dat. Co default an toan neu chua cau hinh.
/// </summary>
public interface IPromotionSettingsService
{
    Task<PromotionSettings> GetAsync(CancellationToken cancellationToken = default);
}

public class PromotionSettings
{
    // Free trial
    public bool TrialEnabled { get; set; } = true;
    public int TrialDays { get; set; } = 7;

    // Early-bird discount
    public bool EarlyBirdEnabled { get; set; } = true;
    public int EarlyBirdDiscountPercent { get; set; } = 30;
    public int EarlyBirdCycles { get; set; } = 3;

    // Referral
    public bool ReferralEnabled { get; set; } = true;
    public int ReferralBonusMessages { get; set; } = 20;
}
