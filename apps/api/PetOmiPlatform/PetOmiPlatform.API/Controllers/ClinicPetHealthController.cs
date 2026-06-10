using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.PetHealthShare.DTOs.Request;
using PetOmiPlatform.Application.Features.PetHealthShare.DTOs.Response;
using PetOmiPlatform.Application.Features.PetHealthShare.Query;

namespace PetOmiPlatform.API.Controllers
{
    [Route("api/clinic/{clinicId:guid}/pet-health-shares")]
    [ApiController]
    [Authorize]
    public class ClinicPetHealthController : BaseController
    {
        public ClinicPetHealthController(IMediator mediator) : base(mediator) { }

        [HttpGet("~/api/clinic/{clinicId:guid}/pets/{petId:guid}/health-overview")]
        public async Task<IActionResult> GetPetHealthOverview(
            Guid clinicId,
            Guid petId,
            [FromQuery] string? shareCode = null)
        {
            var result = await Mediator.Send(new GetClinicPetHealthOverviewQuery(
                RequestUserId: CurrentUserId,
                ClinicId: clinicId,
                PetId: petId,
                ShareCode: shareCode));

            return Ok(BaseResponse<PetHealthOverviewResponse>.Ok(result));
        }

        [HttpPost("resolve")]
        [EnableRateLimiting("HealthShareResolve")]
        public async Task<IActionResult> ResolveHealthShare(
            Guid clinicId,
            [FromBody] ResolvePetHealthShareRequest request)
        {
            var result = await Mediator.Send(new ResolvePetHealthShareQuery(
                RequestUserId: CurrentUserId,
                ClinicId: clinicId,
                Request: request,
                IpAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
                UserAgent: Request.Headers.UserAgent.ToString()));

            return Ok(BaseResponse<PetHealthShareResolvedResponse>.Ok(
                result,
                "Xác thực mã chia sẻ hồ sơ sức khỏe thành công."));
        }
    }
}
