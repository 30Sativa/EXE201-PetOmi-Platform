using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.Vet.Command;
using PetOmiPlatform.Application.Features.Vet.DTOs.Request;
using PetOmiPlatform.Application.Features.Vet.DTOs.Response;
using System.Security.Claims;

namespace PetOmiPlatform.API.Controllers
{
    [Route("api/vet")]
    [ApiController]
    [Authorize]
    public class VetController : BaseController
    {
        public VetController(IMediator mediator) : base(mediator)
        {
        }
        /// <summary>
        /// Tạo hồ sơ bác sĩ thú y cho user đang đăng nhập. Mỗi user chỉ có một VetProfile.
        /// </summary>
        [HttpPost("profile")]

        public async Task<IActionResult> CreateVetProfile([FromBody] CreateVetProfileRequest request)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await Mediator.Send(new CreateVetProfileCommand(userId, request));
            return Ok(BaseResponse<CreateVetProfileResponse>.Ok(result));
        }  
    }
}
