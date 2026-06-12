using MediatR;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Request;

namespace PetOmiPlatform.Application.Features.ChatSubscription.Commands;

public record HandleChatSubscriptionSePayPaymentCommand(
    SePayWebhookRequest Payload,
    string? RawPayload) : IRequest<bool>;
