using MediatR;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.WebsiteFeedback.DTOs.Response;

namespace PetOmiPlatform.Application.Features.WebsiteFeedback.Query
{
    public record GetWebsiteFeedbacksQuery(
        string? Search,
        string? Category,
        string? Status,
        int Page = 1,
        int PageSize = 20
    ) : IRequest<PagedData<WebsiteFeedbackResponse>>;
}
