using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Request;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;
using System.Security.Claims;

namespace PetOmiPlatform.API.Controllers
{
    [Route("api/clinic")]
    [ApiController]
    [Authorize]
    public class ClinicController : BaseController
    {
        public ClinicController(IMediator mediator) : base(mediator)
        {
        }
        /// <summary>
        /// Tạo phòng khám mới ở trạng thái Pending. User phải có VetProfile trước và sẽ được gán ClinicOwner.
        /// </summary>
        [HttpPost]

        public async Task<IActionResult> CreateClinic([FromBody] CreateClinicRequest request)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await Mediator.Send(new CreateClinicCommand(userId, request));
            return Ok(BaseResponse<CreateClinicResponse>.Ok(result));
        }
    }
}
