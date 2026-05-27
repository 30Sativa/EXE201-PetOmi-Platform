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
    /// API ke don thuoc theo tung phieu kham.
    /// </summary>
    [Route("api/examinations/{examinationId:guid}/prescriptions")]
    [Authorize]
    [ApiController]
    public class PrescriptionController : BaseController
    {
        public PrescriptionController(IMediator mediator) : base(mediator) { }

        /// <summary>Them 1 dong thuoc vao don thuoc cua phieu kham.</summary>
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

        /// <summary>Lay danh sach thuoc da ke theo phieu kham.</summary>
        [HttpGet]
        public async Task<IActionResult> GetByExaminationId(
            [FromRoute] Guid examinationId,
            [FromQuery] Guid clinicId)
        {
            var query = new GetPrescriptionsByExaminationQuery(clinicId, CurrentUserId, examinationId);
            var result = await Mediator.Send(query);
            return Ok(BaseResponse<IEnumerable<PrescriptionItemResponse>>.Ok(result));
        }

        /// <summary>Cap nhat thong tin 1 dong thuoc trong don.</summary>
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdatePrescriptionItem(
            [FromRoute] Guid examinationId,
            Guid id,
            [FromBody] UpdatePrescriptionItemRequest request,
            [FromQuery] Guid clinicId)
        {
            var command = new UpdatePrescriptionItemCommand(clinicId, CurrentUserId, id, request);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<PrescriptionItemResponse>.Ok(result, "Cap nhat thuoc trong don thanh cong."));
        }

        /// <summary>Xoa 1 dong thuoc khoi don thuoc.</summary>
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeletePrescriptionItem(
            [FromRoute] Guid examinationId,
            Guid id,
            [FromQuery] Guid clinicId)
        {
            var command = new DeletePrescriptionItemCommand(clinicId, CurrentUserId, id);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<bool>.Ok(result, "Xoa thuoc khoi don thanh cong."));
        }
    }
}
