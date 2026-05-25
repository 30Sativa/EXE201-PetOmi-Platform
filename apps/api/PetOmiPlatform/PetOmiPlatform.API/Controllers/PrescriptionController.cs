using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.Application.Features.Prescription.Command;
using PetOmiPlatform.Application.Features.Prescription.DTOs.Request;
using PetOmiPlatform.Application.Features.Prescription.DTOs.Response;
using PetOmiPlatform.Application.Features.Prescription.Query;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.Application.Common.Models;
using System.Security.Claims;

namespace PetOmiPlatform.API.Controllers
{
    [Route("api/examinations/{examinationId:guid}/prescriptions")]
    [ApiController]
    [Authorize] // Vet/Clinic
    public class PrescriptionController : BaseController
    {
        public PrescriptionController(IMediator mediator) : base(mediator) { }

        private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpPost]
        public async Task<IActionResult> AddPrescriptionItem(
            [FromRoute] Guid examinationId,
            [FromBody] AddPrescriptionItemRequest request,
            [FromQuery] Guid clinicId)
        {
            var command = new AddPrescriptionItemCommand(clinicId, CurrentUserId, examinationId, request);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<PrescriptionItemResponse>.Ok(result, "Them thuoc vao don thanh cong."));
        }

        [HttpGet]
        public async Task<IActionResult> GetByExaminationId(
            [FromRoute] Guid examinationId,
            [FromQuery] Guid clinicId)
        {
            var query = new GetPrescriptionsByExaminationQuery(clinicId, CurrentUserId, examinationId);
            var result = await Mediator.Send(query);
            return Ok(BaseResponse<IEnumerable<PrescriptionItemResponse>>.Ok(result));
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdatePrescriptionItem(Guid id, [FromBody] UpdatePrescriptionItemRequest request, [FromQuery] Guid clinicId)
        {
            var command = new UpdatePrescriptionItemCommand(clinicId, CurrentUserId, id, request);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<PrescriptionItemResponse>.Ok(result, "Cap nhat thuoc trong don thanh cong."));
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeletePrescriptionItem(Guid id, [FromQuery] Guid clinicId)
        {
            var command = new DeletePrescriptionItemCommand(clinicId, CurrentUserId, id);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<bool>.Ok(result, "Xoa thuoc khoi don thanh cong."));
        }
    }
}
