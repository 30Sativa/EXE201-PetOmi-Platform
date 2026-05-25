using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.Application.Features.Appointment.CheckIn.Command;
using PetOmiPlatform.Application.Features.Appointment.CheckIn.DTOs.Response;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.Application.Common.Models;

namespace PetOmiPlatform.API.Controllers
{
    [Route("api/appointments")]
    [ApiController]
    [Authorize] // Staff/Clinic/Vet
    public class CheckInController : BaseController
    {
        public CheckInController(IMediator mediator) : base(mediator) { }

        [HttpPost("{id:guid}/checkin")]
        public async Task<IActionResult> CheckIn(Guid id, [FromQuery] Guid clinicId)
        {
            var command = new CheckInCommand(clinicId, id, CurrentUserId);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<CheckInResponse>.Ok(result, "Check-in thanh cong."));
        }
    }
}
