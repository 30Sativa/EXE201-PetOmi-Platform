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
    /// API phiếu khám (SOAP): tạo, cập nhật, hoàn tất và truy vấn theo appointment.
    /// </summary>
    [Route("api/examinations")]
    [ApiController]
    [Authorize] // Vet/Clinic
    public class MedicalExaminationController : BaseController
    {
        public MedicalExaminationController(IMediator mediator) : base(mediator) { }

        /// <summary>Tạo phiếu khám mới cho lịch hẹn đã check-in.</summary>
        [HttpPost]
        public async Task<IActionResult> CreateExamination([FromBody] CreateExaminationRequest request, [FromQuery] Guid clinicId)
        {
            var command = new CreateExaminationCommand(clinicId, CurrentUserId, request);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<ExaminationResponse>.Ok(result, "Tạo phiếu khám thành công."));
        }

        /// <summary>Lấy phiếu khám theo appointment để FE hiển thị trong màn hình khám bệnh.</summary>
        [HttpGet("by-appointment/{appointmentId:guid}")]
        public async Task<IActionResult> GetByAppointmentId(Guid appointmentId)
        {
            var query = new GetExaminationByAppointmentQuery(appointmentId, CurrentUserId);
            var result = await Mediator.Send(query);
            return result != null
                ? Ok(BaseResponse<ExaminationResponse>.Ok(result))
                : NotFound(BaseResponse<ExaminationResponse?>.Fail("Không tìm thấy phiếu khám.", 404));
        }

        /// <summary>Cập nhật nội dung khám, chẩn đoán, treatment plan trong lúc đang khám.</summary>
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdateExamination(Guid id, [FromBody] UpdateExaminationRequest request, [FromQuery] Guid clinicId)
        {
            var command = new UpdateExaminationCommand(clinicId, CurrentUserId, id, request);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<ExaminationResponse>.Ok(result, "Cập nhật phiếu khám thành công."));
        }

        /// <summary>Hoàn tất phiếu khám (yêu cầu đã có chẩn đoán).</summary>
        [HttpPost("{id:guid}/complete")]
        public async Task<IActionResult> CompleteExamination(Guid id, [FromQuery] Guid clinicId)
        {
            var command = new CompleteExaminationCommand(clinicId, CurrentUserId, id);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<ExaminationResponse>.Ok(result, "Hoàn tất phiếu khám thành công."));
        }
    }
}
