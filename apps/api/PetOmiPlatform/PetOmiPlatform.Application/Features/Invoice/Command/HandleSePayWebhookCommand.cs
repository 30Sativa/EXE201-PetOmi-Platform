using MediatR;
using PetOmiPlatform.Application.Features.Invoice.DTOs.Request;

namespace PetOmiPlatform.Application.Features.Invoice.Command
{
    public record HandleSePayWebhookCommand(
        SePayWebhookRequest Payload,
        string? ReceivedApiKey,
        string RawPayload
    ) : IRequest<bool>;
}
