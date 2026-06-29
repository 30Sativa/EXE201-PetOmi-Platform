using MediatR;
using PetOmiPlatform.Application.Features.WebsiteFeedback.DTOs.Request;
using PetOmiPlatform.Application.Features.WebsiteFeedback.DTOs.Response;

namespace PetOmiPlatform.Application.Features.WebsiteFeedback.Command
{
    public record CreateWebsiteFeedbackCommand(Guid UserId, CreateWebsiteFeedbackRequest Request)
        : IRequest<WebsiteFeedbackResponse>;
}
