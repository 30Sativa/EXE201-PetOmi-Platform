using MediatR;

namespace PetOmiPlatform.Application.Features.ChatSubscription.Commands;

public record DeleteChatSubscriptionVoucherCommand(Guid VoucherId) : IRequest;
