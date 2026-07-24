using MediatR;
using PetOmiPlatform.Application.Features.ChatSubscription.DTOs;
using PetOmiPlatform.Application.Features.ChatSubscription.Mappers;
using PetOmiPlatform.Application.Features.ChatSubscription.Queries;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.ChatSubscription.Handlers;

public class GetChatSubscriptionVouchersQueryHandler
    : IRequestHandler<GetChatSubscriptionVouchersQuery, List<ChatSubscriptionVoucherResponse>>
{
    private readonly IChatSubscriptionRepository _subscriptionRepository;

    public GetChatSubscriptionVouchersQueryHandler(IChatSubscriptionRepository subscriptionRepository)
    {
        _subscriptionRepository = subscriptionRepository;
    }

    public async Task<List<ChatSubscriptionVoucherResponse>> Handle(
        GetChatSubscriptionVouchersQuery request,
        CancellationToken cancellationToken)
    {
        var vouchers = await _subscriptionRepository.GetAdminVouchersAsync(request.Take);
        return vouchers.Select(v => v.ToResponse()).ToList();
    }
}
