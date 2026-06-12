using MediatR;
using PetOmiPlatform.Application.Features.ChatSubscription.DTOs;

namespace PetOmiPlatform.Application.Features.ChatSubscription.Queries;

public record GetChatSubscriptionStatusQuery(
    Guid OwnerUserId,
    Guid? PetId) : IRequest<ChatSubscriptionStatusResponse>;
