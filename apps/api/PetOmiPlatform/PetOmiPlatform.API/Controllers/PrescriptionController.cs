using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.Application.Features.Prescription.Command;
using PetOmiPlatform.Application.Features.Prescription.DTOs.Request;
using PetOmiPlatform.Application.Features.Prescription.Query;
using PetOmiPlatform.API.Common;
using System.Security.Claims;

namespace PetOmiPlatform.API.Controllers
{
    [Route("api/examinations/{examinationId:guid}/prescriptions")]
    [Authorize] // Vet/Clinic
    public class PrescriptionController : BaseController
    {
        public PrescriptionController(IMediator mediator) : base(mediator) { }

        private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpPost]
        public async Task<IActionResult> AddPrescriptionItem([FromBody] AddPrescriptionItemRequest request, [FromQuery] Guid clinicId, [FromQuery] Guid examinationId)
        {
            var command = new AddPrescriptionItemCommand(clinicId, examinationId, request);
            var result = await Mediator.Send(command);
            return Ok(result);
        }

        [HttpGet("by-examination/{examinationId:guid}")]
        public async Task<IActionResult> GetByExaminationId(Guid examinationId, [FromQuery] Guid clinicId)
        {
            var query = new GetPrescriptionsByExaminationQuery(clinicId, examinationId);
            var result = await Mediator.Send(query);
            return Ok(result);
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdatePrescriptionItem(Guid id, [FromBody] UpdatePrescriptionItemRequest request, [FromQuery] Guid clinicId)
        {
            var command = new UpdatePrescriptionItemCommand(clinicId, id, request);
            var result = await Mediator.Send(command);
            return Ok(result);
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeletePrescriptionItem(Guid id, [FromQuery] Guid clinicId)
        {
            var command = new DeletePrescriptionItemCommand(clinicId, id);
            var result = await Mediator.Send(command);
            return Ok(result);
        }
    }
}
