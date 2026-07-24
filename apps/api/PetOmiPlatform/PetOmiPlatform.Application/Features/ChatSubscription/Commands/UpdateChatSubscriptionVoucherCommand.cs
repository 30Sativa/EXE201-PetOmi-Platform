using MediatR;
using PetOmiPlatform.Application.Features.ChatSubscription.DTOs;

namespace PetOmiPlatform.Application.Features.ChatSubscription.Commands;

public record UpdateChatSubscriptionVoucherCommand(
    Guid VoucherId,
    ChatSubscriptionVoucherRequest Request) : IRequest<ChatSubscriptionVoucherResponse>;
