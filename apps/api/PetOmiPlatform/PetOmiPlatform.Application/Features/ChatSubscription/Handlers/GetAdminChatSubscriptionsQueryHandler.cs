using MediatR;
using PetOmiPlatform.Application.Features.ChatSubscription.DTOs;
using PetOmiPlatform.Application.Features.ChatSubscription.Mappers;
using PetOmiPlatform.Application.Features.ChatSubscription.Queries;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.ChatSubscription.Handlers;

public class GetAdminChatSubscriptionsQueryHandler
    : IRequestHandler<GetAdminChatSubscriptionsQuery, AdminChatSubscriptionsResponse>
{
    private readonly IChatSubscriptionRepository _subscriptionRepository;

    public GetAdminChatSubscriptionsQueryHandler(IChatSubscriptionRepository subscriptionRepository)
    {
        _subscriptionRepository = subscriptionRepository;
    }

    public async Task<AdminChatSubscriptionsResponse> Handle(
        GetAdminChatSubscriptionsQuery request,
        CancellationToken cancellationToken)
    {
        var take = Math.Clamp(request.Take, 1, 200);
        var plans = await _subscriptionRepository.GetActivePlansAsync();
        var subscriptions = await _subscriptionRepository.GetAdminSubscriptionsAsync(take);
        var payments = await _subscriptionRepository.GetAdminPaymentsAsync(take);

        return new AdminChatSubscriptionsResponse
        {
            Plans = plans.Select(p => p.ToResponse()).ToList(),
            Subscriptions = subscriptions.Select(s => s.ToResponse()).ToList(),
            Payments = payments.Select(p => p.ToResponse()).ToList()
        };
    }
}
