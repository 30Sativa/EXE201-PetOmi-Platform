using MediatR;
using PetOmiPlatform.Application.Features.ChatSubscription.DTOs;

namespace PetOmiPlatform.Application.Features.ChatSubscription.Queries;

public record GetChatSubscriptionVouchersQuery(int Take) : IRequest<List<ChatSubscriptionVoucherResponse>>;
