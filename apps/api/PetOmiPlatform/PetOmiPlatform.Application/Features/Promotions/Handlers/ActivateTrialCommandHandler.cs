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

        // Dang co Premium active thi khong can trial.
        var active = await _subscriptionRepository.GetActiveOwnerSubscriptionAsync(request.UserId, DateTime.UtcNow);
        if (active != null)
            throw new ConflictException("Ban dang co goi Premium dang hoat dong.");

        var premiumPlan = await _subscriptionRepository.GetPlanByCodeAsync(PremiumPlanCode)
            ?? throw new NotFoundException("Khong tim thay goi Premium.");

        var trial = ChatSubscriptionDomain.CreateTrial(
            ownerUserId: request.UserId,
            planId: premiumPlan.Id,
            startsAtUtc: DateTime.UtcNow,
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
