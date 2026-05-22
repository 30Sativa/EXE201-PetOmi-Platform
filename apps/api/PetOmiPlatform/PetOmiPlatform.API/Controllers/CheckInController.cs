using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.Application.Features.Appointment.CheckIn.Command;
using PetOmiPlatform.API.Common;
using System.Security.Claims;

namespace PetOmiPlatform.API.Controllers
{
    [Route("api/appointments")]
    [Authorize] // Staff/Clinic/Vet
    public class CheckInController : BaseController
    {
        public CheckInController(IMediator mediator) : base(mediator) { }

        private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpPost("{id:guid}/checkin")]
        public async Task<IActionResult> CheckIn(Guid id, [FromQuery] Guid clinicId)
        {
            var command = new CheckInCommand(clinicId, id, CurrentUserId);
            var result = await Mediator.Send(command);
            return Ok(result);
        }
    }
}
