using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.PetHealthShare.Command;
using PetOmiPlatform.Application.Features.PetHealthShare.DTOs.Request;
using PetOmiPlatform.Application.Features.PetHealthShare.DTOs.Response;
using PetOmiPlatform.Application.Features.PetHealthShare.Query;

namespace PetOmiPlatform.API.Controllers
{
    [Route("api/pets/{petId:guid}/health-shares")]
    [ApiController]
    [Authorize]
    public class PetHealthShareController : BaseController
    {
        public PetHealthShareController(IMediator mediator) : base(mediator) { }

        [HttpGet]
        public async Task<IActionResult> GetHealthShares(Guid petId)
        {
            var result = await Mediator.Send(new GetPetHealthSharesQuery(CurrentUserId, petId));
            return Ok(BaseResponse<List<PetHealthShareResponse>>.Ok(result));
        }

        [HttpPost]
        public async Task<IActionResult> CreateHealthShare(
            Guid petId,
            [FromBody] CreatePetHealthShareRequest request)
        {
            var result = await Mediator.Send(new CreatePetHealthShareCommand(CurrentUserId, petId, request));
            return Ok(BaseResponse<PetHealthShareResponse>.Ok(result, "Tạo mã chia sẻ hồ sơ sức khỏe thành công."));
        }

        [HttpDelete("{shareTokenId:guid}")]
        public async Task<IActionResult> RevokeHealthShare(Guid petId, Guid shareTokenId)
        {
            await Mediator.Send(new RevokePetHealthShareCommand(CurrentUserId, petId, shareTokenId));
            return Ok(BaseResponse<object>.Ok(null, "Thu hồi mã chia sẻ hồ sơ sức khỏe thành công."));
        }
    }
}
