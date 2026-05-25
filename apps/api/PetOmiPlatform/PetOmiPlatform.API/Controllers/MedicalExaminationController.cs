using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.Application.Features.MedicalExamination.Command;
using PetOmiPlatform.Application.Features.MedicalExamination.DTOs.Request;
using PetOmiPlatform.Application.Features.MedicalExamination.DTOs.Response;
using PetOmiPlatform.Application.Features.MedicalExamination.Query;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.Application.Common.Models;
using System.Security.Claims;

namespace PetOmiPlatform.API.Controllers
{
    [Route("api/examinations")]
    [ApiController]
    [Authorize] // Vet/Clinic
    public class MedicalExaminationController : BaseController
    {
        public MedicalExaminationController(IMediator mediator) : base(mediator) { }

        private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpPost]
        public async Task<IActionResult> CreateExamination([FromBody] CreateExaminationRequest request, [FromQuery] Guid clinicId)
        {
            var command = new CreateExaminationCommand(clinicId, CurrentUserId, request);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<ExaminationResponse>.Ok(result, "Tao phieu kham thanh cong."));
        }

        [HttpGet("by-appointment/{appointmentId:guid}")]
        public async Task<IActionResult> GetByAppointmentId(Guid appointmentId)
        {
            var query = new GetExaminationByAppointmentQuery(appointmentId, CurrentUserId);
            var result = await Mediator.Send(query);
            return result != null
                ? Ok(BaseResponse<ExaminationResponse>.Ok(result))
                : NotFound(BaseResponse<ExaminationResponse?>.Fail("Khong tim thay phieu kham.", 404));
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdateExamination(Guid id, [FromBody] UpdateExaminationRequest request, [FromQuery] Guid clinicId)
        {
            var command = new UpdateExaminationCommand(clinicId, CurrentUserId, id, request);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<ExaminationResponse>.Ok(result, "Cap nhat phieu kham thanh cong."));
        }

        [HttpPost("{id:guid}/complete")]
        public async Task<IActionResult> CompleteExamination(Guid id, [FromQuery] Guid clinicId)
        {
            var command = new CompleteExaminationCommand(clinicId, CurrentUserId, id);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<ExaminationResponse>.Ok(result, "Hoan tat phieu kham thanh cong."));
        }
    }
}
