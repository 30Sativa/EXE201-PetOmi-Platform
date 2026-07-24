using MediatR;
using PetOmiPlatform.Application.Features.ChatSubscription.DTOs;

namespace PetOmiPlatform.Application.Features.ChatSubscription.Commands;

public record CreateChatSubscriptionVoucherCommand(
    Guid AdminUserId,
    ChatSubscriptionVoucherRequest Request) : IRequest<ChatSubscriptionVoucherResponse>;
