using MediatR;
using PetOmiPlatform.Application.Features.ChatSubscription.DTOs;

namespace PetOmiPlatform.Application.Features.ChatSubscription.Commands;

public record ToggleChatSubscriptionVoucherCommand(
    Guid VoucherId,
    bool IsActive) : IRequest<ChatSubscriptionVoucherResponse>;
