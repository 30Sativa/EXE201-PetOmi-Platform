using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Request;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;
using System.Security.Claims;

namespace PetOmiPlatform.API.Controllers
{
    [Route("api/admin/clinics")]
    [ApiController]
    [Authorize]
    public class AdminClinicController : BaseController
    {
        public AdminClinicController(IMediator mediator) : base(mediator)
        {
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
