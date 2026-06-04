using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.Prescription.Command;
using PetOmiPlatform.Application.Features.Prescription.DTOs.Request;
using PetOmiPlatform.Application.Features.Prescription.DTOs.Response;
using PetOmiPlatform.Application.Features.Prescription.Query;

namespace PetOmiPlatform.API.Controllers
{
    /// <summary>
    /// API kê đơn thuốc theo từng phiếu khám.
    /// </summary>
    [Route("api/examinations/{examinationId:guid}/prescriptions")]
    [Authorize]
    [ApiController]
    public class PrescriptionController : BaseController
    {
        public PrescriptionController(IMediator mediator) : base(mediator) { }

        /// <summary>Thêm một dòng thuốc vào đơn thuốc của phiếu khám.</summary>
        [HttpPost]
        public async Task<IActionResult> AddPrescriptionItem(
            [FromRoute] Guid examinationId,
            [FromBody] AddPrescriptionItemRequest request,
            [FromQuery] Guid clinicId)
        {
            var command = new AddPrescriptionItemCommand(clinicId, CurrentUserId, examinationId, request);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<PrescriptionItemResponse>.Ok(result, "Thêm thuốc vào đơn thành công."));
        }

        /// <summary>Lấy danh sách thuốc đã kê theo phiếu khám.</summary>
        [HttpGet]
        public async Task<IActionResult> GetByExaminationId(
            [FromRoute] Guid examinationId,
            [FromQuery] Guid clinicId)
        {
            var query = new GetPrescriptionsByExaminationQuery(clinicId, CurrentUserId, examinationId);
            var result = await Mediator.Send(query);
            return Ok(BaseResponse<IEnumerable<PrescriptionItemResponse>>.Ok(result));
        }

        /// <summary>Cập nhật thông tin một dòng thuốc trong đơn.</summary>
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdatePrescriptionItem(
            [FromRoute] Guid examinationId,
            Guid id,
            [FromBody] UpdatePrescriptionItemRequest request,
            [FromQuery] Guid clinicId)
        {
            var command = new UpdatePrescriptionItemCommand(clinicId, CurrentUserId, examinationId, id, request);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<PrescriptionItemResponse>.Ok(result, "Cập nhật thuốc trong đơn thành công."));
        }

        /// <summary>Xóa một dòng thuốc khỏi đơn thuốc.</summary>
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeletePrescriptionItem(
            [FromRoute] Guid examinationId,
            Guid id,
            [FromQuery] Guid clinicId)
        {
            var command = new DeletePrescriptionItemCommand(clinicId, CurrentUserId, examinationId, id);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<bool>.Ok(result, "Xóa thuốc khỏi đơn thành công."));
        }
    }
}
