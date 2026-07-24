using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Promotions.Commands;
using PetOmiPlatform.Application.Features.Promotions.DTOs;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Promotions.Handlers;

public class ActivateTrialCommandHandler
    : IRequestHandler<ActivateTrialCommand, ActivateTrialResponse>
{
    private const string PremiumPlanCode = "premium";

    private readonly IPromotionSettingsService _promotionSettings;
    private readonly IChatSubscriptionRepository _subscriptionRepository;
    private readonly IUnitOfWork _unitOfWork;

    public ActivateTrialCommandHandler(
        IPromotionSettingsService promotionSettings,
        IChatSubscriptionRepository subscriptionRepository,
        IUnitOfWork unitOfWork)
    {
        _promotionSettings = promotionSettings;
        _subscriptionRepository = subscriptionRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ActivateTrialResponse> Handle(
        ActivateTrialCommand request,
        CancellationToken cancellationToken)
    {
        var promo = await _promotionSettings.GetAsync(cancellationToken);
        if (!promo.TrialEnabled || promo.TrialDays <= 0)
            throw new ConflictException("Uu dai dung thu hien khong kha dung.");

        // Moi user chi duoc dung thu 1 lan.
        if (await _subscriptionRepository.HasAnyTrialAsync(request.UserId))
            throw new ConflictException("Ban da su dung uu dai dung thu truoc do.");

        var now = DateTime.UtcNow;
        // Dang co Premium active thi khong the nhan them trial de cong don ngay mien phi.
        var active = await _subscriptionRepository.GetActiveOwnerSubscriptionAsync(request.UserId, now);
        if (active != null)
            throw new ConflictException("Ban dang co goi Premium dang hoat dong.");

        // Trial chi danh cho tai khoan chua tung mua/nhan Premium tra phi.
        if (await _subscriptionRepository.CountPaidPaymentsAsync(request.UserId) > 0)
            throw new ConflictException("Uu dai dung thu chi ap dung truoc lan thanh toan Premium dau tien.");

        var latestSubscription = await _subscriptionRepository.GetLatestOwnerSubscriptionAsync(request.UserId);
        if (latestSubscription != null && !latestSubscription.IsTrial)
            throw new ConflictException("Uu dai dung thu chi ap dung truoc khi ban tung dung Premium tra phi.");

        var premiumPlan = await _subscriptionRepository.GetPlanByCodeAsync(PremiumPlanCode)
            ?? throw new NotFoundException("Khong tim thay goi Premium.");

        var trial = ChatSubscriptionDomain.CreateTrial(
            ownerUserId: request.UserId,
            planId: premiumPlan.Id,
            startsAtUtc: now,
            trialDays: promo.TrialDays);

        await _subscriptionRepository.AddSubscriptionAsync(trial);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new ActivateTrialResponse
        {
            SubscriptionId = trial.Id,
            ExpiresAt = trial.ExpiresAt,
            TrialDays = promo.TrialDays,
        };
    }
}
