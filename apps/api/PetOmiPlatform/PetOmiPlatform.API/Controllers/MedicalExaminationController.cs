using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.Application.Features.MedicalExamination.Command;
using PetOmiPlatform.Application.Features.MedicalExamination.DTOs.Request;
using PetOmiPlatform.Application.Features.MedicalExamination.DTOs.Response;
using PetOmiPlatform.Application.Features.MedicalExamination.Query;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.Application.Common.Models;

namespace PetOmiPlatform.API.Controllers
{
    /// <summary>
    /// API phieu kham (SOAP): tao, cap nhat, hoan tat va truy van theo appointment.
    /// </summary>
    [Route("api/examinations")]
    [ApiController]
    [Authorize] // Vet/Clinic
    public class MedicalExaminationController : BaseController
    {
        public MedicalExaminationController(IMediator mediator) : base(mediator) { }

        /// <summary>Tao phieu kham moi cho lich hen da check-in.</summary>
        [HttpPost]
        public async Task<IActionResult> CreateExamination([FromBody] CreateExaminationRequest request, [FromQuery] Guid clinicId)
        {
            var command = new CreateExaminationCommand(clinicId, CurrentUserId, request);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<ExaminationResponse>.Ok(result, "Tao phieu kham thanh cong."));
        }

        /// <summary>Lay phieu kham theo appointment de FE hien thi trong man hinh kham benh.</summary>
        [HttpGet("by-appointment/{appointmentId:guid}")]
        public async Task<IActionResult> GetByAppointmentId(Guid appointmentId)
        {
            var query = new GetExaminationByAppointmentQuery(appointmentId, CurrentUserId);
            var result = await Mediator.Send(query);
            return result != null
                ? Ok(BaseResponse<ExaminationResponse>.Ok(result))
                : NotFound(BaseResponse<ExaminationResponse?>.Fail("Khong tim thay phieu kham.", 404));
        }

        /// <summary>Cap nhat noi dung kham, chan doan, treatment plan trong luc dang kham.</summary>
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdateExamination(Guid id, [FromBody] UpdateExaminationRequest request, [FromQuery] Guid clinicId)
        {
            var command = new UpdateExaminationCommand(clinicId, CurrentUserId, id, request);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<ExaminationResponse>.Ok(result, "Cap nhat phieu kham thanh cong."));
        }

        /// <summary>Hoan tat phieu kham (yeu cau da co chan doan).</summary>
        [HttpPost("{id:guid}/complete")]
        public async Task<IActionResult> CompleteExamination(Guid id, [FromQuery] Guid clinicId)
        {
            var command = new CompleteExaminationCommand(clinicId, CurrentUserId, id);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<ExaminationResponse>.Ok(result, "Hoan tat phieu kham thanh cong."));
        }
    }
}
