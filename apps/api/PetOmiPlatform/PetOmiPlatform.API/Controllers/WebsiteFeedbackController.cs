using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.API.Common.Authorization;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.WebsiteFeedback.Command;
using PetOmiPlatform.Application.Features.WebsiteFeedback.DTOs.Request;
using PetOmiPlatform.Application.Features.WebsiteFeedback.DTOs.Response;
using PetOmiPlatform.Application.Features.WebsiteFeedback.Query;

namespace PetOmiPlatform.API.Controllers
{
    [Route("api/website-feedback")]
    [ApiController]
    [Authorize]
    public class WebsiteFeedbackController : BaseController
    {
        public WebsiteFeedbackController(IMediator mediator) : base(mediator) { }

        [HttpPost]
        public async Task<IActionResult> CreateFeedback([FromBody] CreateWebsiteFeedbackRequest request)
        {
            var result = await Mediator.Send(new CreateWebsiteFeedbackCommand(CurrentUserId, request));
            return Ok(BaseResponse<WebsiteFeedbackResponse>.Ok(result, "Da gui feedback thanh cong."));
        }

        [HttpGet("admin")]
        [Authorize(Policy = Policies.AdminOnly)]
        public async Task<IActionResult> GetFeedbacks(
            [FromQuery] string? search,
            [FromQuery] string? category,
            [FromQuery] string? status,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var result = await Mediator.Send(new GetWebsiteFeedbacksQuery(
                search,
                category,
                status,
                page,
                pageSize));

            return Ok(BaseResponse<PagedData<WebsiteFeedbackResponse>>.Ok(result));
        }
    }
}
