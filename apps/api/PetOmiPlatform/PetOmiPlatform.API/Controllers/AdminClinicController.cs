using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.API.Common.Authorization;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Request;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;
using PetOmiPlatform.Domain.Common.Constants;
using System.Security.Claims;

namespace PetOmiPlatform.API.Controllers
{
    [Route("api/admin/clinics")]
    [ApiController]
    [Authorize(Policy = Policies.AdminOnly)]
    public class AdminClinicController : BaseController
    {
        public AdminClinicController(IMediator mediator) : base(mediator) { }

        /// <summary>
        /// Admin lấy danh sách phòng khám theo status.
        /// Mặc định lấy Pending để duyệt. Có thể truyền status=Approved|Rejected.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetClinics(
            [FromQuery] string status = "Pending",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var result = await Mediator.Send(new GetClinicsByStatusQuery(status, page, pageSize));
            return Ok(BaseResponse<PagedData<ClinicListItemResponse>>.Ok(result));
        }

        /// <summary>
        /// Admin duyệt phòng khám đang Pending. Clinic chuyển sang Approved và lưu admin đã duyệt.
        /// </summary>
        [HttpPost("{clinicId:guid}/approve")]
        public async Task<IActionResult> ApproveClinic(Guid clinicId)
        {
            var adminId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await Mediator.Send(new ApproveClinicCommand(adminId, clinicId));
            return Ok(BaseResponse<ReviewClinicResponse>.Ok(result, "Phòng khám đã được duyệt."));
        }

        /// <summary>
        /// Admin từ chối phòng khám đang Pending. Clinic chuyển sang Rejected và các VetClinic active của clinic bị deactivate.
        /// </summary>
        [HttpPost("{clinicId:guid}/reject")]
        public async Task<IActionResult> RejectClinic(Guid clinicId, [FromBody] RejectClinicRequest request)
        {
            var adminId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await Mediator.Send(new RejectClinicCommand(adminId, clinicId, request.Reason));
            return Ok(BaseResponse<ReviewClinicResponse>.Ok(result, "Phòng khám đã bị từ chối."));
        }
    }
}   
