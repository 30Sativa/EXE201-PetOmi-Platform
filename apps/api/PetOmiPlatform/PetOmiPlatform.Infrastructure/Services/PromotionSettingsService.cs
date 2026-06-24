using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Infrastructure.Services;

public class PromotionSettingsService : IPromotionSettingsService
{
    private readonly ISystemSettingRepository _settingRepository;

    public PromotionSettingsService(ISystemSettingRepository settingRepository)
    {
        _settingRepository = settingRepository;
    }

    public async Task<PromotionSettings> GetAsync(CancellationToken cancellationToken = default)
    {
        var all = await _settingRepository.GetByCategoryAsync("Promotion");
        var map = all.ToDictionary(s => s.SettingKey, s => s.SettingValue, StringComparer.OrdinalIgnoreCase);

        var defaults = new PromotionSettings();

        return new PromotionSettings
        {
            TrialEnabled = GetBool(map, "Promotion:Trial:Enabled", defaults.TrialEnabled),
            TrialDays = GetInt(map, "Promotion:Trial:Days", defaults.TrialDays),

            EarlyBirdEnabled = GetBool(map, "Promotion:EarlyBird:Enabled", defaults.EarlyBirdEnabled),
            EarlyBirdDiscountPercent = GetInt(map, "Promotion:EarlyBird:DiscountPercent", defaults.EarlyBirdDiscountPercent),
            EarlyBirdCycles = GetInt(map, "Promotion:EarlyBird:Cycles", defaults.EarlyBirdCycles),

            ReferralEnabled = GetBool(map, "Promotion:Referral:Enabled", defaults.ReferralEnabled),
            ReferralBonusMessages = GetInt(map, "Promotion:Referral:BonusMessages", defaults.ReferralBonusMessages),
        };
    }

    private static bool GetBool(IReadOnlyDictionary<string, string> map, string key, bool fallback)
        => map.TryGetValue(key, out var v) && bool.TryParse(v, out var parsed) ? parsed : fallback;

    private static int GetInt(IReadOnlyDictionary<string, string> map, string key, int fallback)
        => map.TryGetValue(key, out var v) && int.TryParse(v, out var parsed) && parsed >= 0 ? parsed : fallback;
}
