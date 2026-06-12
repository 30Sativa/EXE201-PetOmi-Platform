using MediatR;
using PetOmiPlatform.Application.Features.ChatSubscription.DTOs;

namespace PetOmiPlatform.Application.Features.ChatSubscription.Queries;

public record GetChatSubscriptionPaymentStatusQuery(
    Guid OwnerUserId,
    Guid PaymentId) : IRequest<ChatSubscriptionPaymentResponse>;
