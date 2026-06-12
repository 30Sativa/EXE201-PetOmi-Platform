using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.ChatSubscription.DTOs;
using PetOmiPlatform.Application.Features.ChatSubscription.Mappers;
using PetOmiPlatform.Application.Features.ChatSubscription.Queries;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.ChatSubscription.Handlers;

public class GetChatSubscriptionStatusQueryHandler
    : IRequestHandler<GetChatSubscriptionStatusQuery, ChatSubscriptionStatusResponse>
{
    private readonly IChatSubscriptionAccessService _accessService;
    private readonly IChatSubscriptionRepository _subscriptionRepository;
    private readonly IPetRepository _petRepository;

    public GetChatSubscriptionStatusQueryHandler(
        IChatSubscriptionAccessService accessService,
        IChatSubscriptionRepository subscriptionRepository,
        IPetRepository petRepository)
    {
        _accessService = accessService;
        _subscriptionRepository = subscriptionRepository;
        _petRepository = petRepository;
    }

    public async Task<ChatSubscriptionStatusResponse> Handle(
        GetChatSubscriptionStatusQuery request,
        CancellationToken cancellationToken)
    {
        if (request.PetId.HasValue)
        {
            var pet = await _petRepository.GetByIdAsync(request.PetId.Value)
                ?? throw new NotFoundException("Pet", request.PetId.Value);
            pet.EnsureActive();
            pet.EnsureOwner(request.OwnerUserId);
        }

        var access = await _accessService.GetAccessAsync(
            request.OwnerUserId,
            request.PetId,
            cancellationToken);

        var plans = await _subscriptionRepository.GetActivePlansAsync();
        var ownerSubscriptions = await _subscriptionRepository.GetOwnerPetSubscriptionsAsync(
            request.OwnerUserId,
            DateTime.UtcNow);

        return new ChatSubscriptionStatusResponse
        {
            CurrentPlanCode = access.PlanCode,
            CurrentPlanName = access.PlanName,
            SelectedPetId = request.PetId,
            SubscriptionId = access.SubscriptionId,
            IsPremium = access.IsPremium,
            SubscriptionExpiresAt = access.SubscriptionExpiresAt,
            CanSend = access.CanSend,
            BlockReason = access.BlockReason,
            Usage = access.ToUsageResponse(),
            Capabilities = access.ToCapabilitiesResponse(),
            Plans = plans.Select(p => p.ToResponse()).ToList(),
            OwnerPetSubscriptions = ownerSubscriptions.Select(s => s.ToResponse()).ToList()
        };
    }
}
