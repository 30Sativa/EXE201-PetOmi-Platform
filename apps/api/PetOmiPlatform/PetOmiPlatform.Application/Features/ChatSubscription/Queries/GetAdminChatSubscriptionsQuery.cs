using MediatR;
using PetOmiPlatform.Application.Features.ChatSubscription.DTOs;

namespace PetOmiPlatform.Application.Features.ChatSubscription.Queries;

public record GetAdminChatSubscriptionsQuery(int Take = 50) : IRequest<AdminChatSubscriptionsResponse>;
