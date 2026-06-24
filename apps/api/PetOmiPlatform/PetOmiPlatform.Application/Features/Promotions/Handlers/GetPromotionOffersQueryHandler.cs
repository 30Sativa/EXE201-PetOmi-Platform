using MediatR;
using PetOmiPlatform.Application.Features.Promotions.DTOs;
using PetOmiPlatform.Application.Features.Promotions.Queries;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Promotions.Handlers;

public class GetPromotionOffersQueryHandler
    : IRequestHandler<GetPromotionOffersQuery, PromotionOffersResponse>
{
    private readonly IPromotionSettingsService _promotionSettings;
    private readonly IChatSubscriptionRepository _subscriptionRepository;
    private readonly IReferralRepository _referralRepository;

    public GetPromotionOffersQueryHandler(
        IPromotionSettingsService promotionSettings,
        IChatSubscriptionRepository subscriptionRepository,
        IReferralRepository referralRepository)
    {
        _promotionSettings = promotionSettings;
        _subscriptionRepository = subscriptionRepository;
        _referralRepository = referralRepository;
    }

    public async Task<PromotionOffersResponse> Handle(
        GetPromotionOffersQuery request,
        CancellationToken cancellationToken)
    {
        var promo = await _promotionSettings.GetAsync(cancellationToken);

        var trialUsed = await _subscriptionRepository.HasAnyTrialAsync(request.UserId);
        var paidCount = await _subscriptionRepository.CountPaidPaymentsAsync(request.UserId);
        var referralCode = await _referralRepository.GetOrCreateReferralCodeAsync(request.UserId);

        return new PromotionOffersResponse
        {
            TrialEnabled = promo.TrialEnabled,
            TrialDays = promo.TrialDays,
            TrialAlreadyUsed = trialUsed,

            EarlyBirdEnabled = promo.EarlyBirdEnabled,
            EarlyBirdDiscountPercent = promo.EarlyBirdDiscountPercent,
            EarlyBirdCycles = promo.EarlyBirdCycles,
            // Du dieu kien Early-bird neu so lan da thanh toan con trong so chu ky uu dai.
            EarlyBirdEligible = promo.EarlyBirdEnabled && paidCount < promo.EarlyBirdCycles,

            ReferralEnabled = promo.ReferralEnabled,
            ReferralBonusMessages = promo.ReferralBonusMessages,
            ReferralCode = referralCode,
        };
    }
}

public class GetReferralInfoQueryHandler
    : IRequestHandler<GetReferralInfoQuery, ReferralInfoResponse>
{
    private readonly IPromotionSettingsService _promotionSettings;
    private readonly IReferralRepository _referralRepository;

    public GetReferralInfoQueryHandler(
        IPromotionSettingsService promotionSettings,
        IReferralRepository referralRepository)
    {
        _promotionSettings = promotionSettings;
        _referralRepository = referralRepository;
    }

    public async Task<ReferralInfoResponse> Handle(
        GetReferralInfoQuery request,
        CancellationToken cancellationToken)
    {
        var promo = await _promotionSettings.GetAsync(cancellationToken);
        var code = await _referralRepository.GetOrCreateReferralCodeAsync(request.UserId);
        var count = await _referralRepository.GetSuccessfulReferralCountAsync(request.UserId);
        var totalBonus = await _referralRepository.GetTotalBonusMessagesAsync(request.UserId);

        return new ReferralInfoResponse
        {
            ReferralCode = code,
            SuccessfulReferrals = count,
            TotalBonusMessages = totalBonus,
            BonusPerReferral = promo.ReferralBonusMessages,
            ReferralEnabled = promo.ReferralEnabled,
        };
    }
}
