using MediatR;
using PetOmiPlatform.Application.Features.ChatSubscription.DTOs;

namespace PetOmiPlatform.Application.Features.ChatSubscription.Commands;

public record CreateChatSubscriptionPaymentCommand(
    Guid OwnerUserId,
    CreateChatSubscriptionPaymentRequest Request) : IRequest<ChatSubscriptionPaymentResponse>;
