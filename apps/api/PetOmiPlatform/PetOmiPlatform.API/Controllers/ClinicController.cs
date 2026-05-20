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
    [Route("api/clinic")]
    [ApiController]
    [Authorize]
    public class ClinicController : BaseController
    {
        public ClinicController(IMediator mediator) : base(mediator) { }

        /// <summary>
        /// Tạo phòng khám mới ở trạng thái Pending.
        /// User phải có VetProfile trước và sẽ được gán ClinicOwner.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateClinic([FromBody] CreateClinicRequest request)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await Mediator.Send(new CreateClinicCommand(userId, request));
            return Ok(BaseResponse<CreateClinicResponse>.Ok(result, "Đăng ký phòng khám thành công. Vui lòng chờ Admin duyệt."));
        }

        /// <summary>
        /// Lấy thông tin clinic hiện tại của user đang đăng nhập (với tư cách ClinicOwner).
        /// Trả về null nếu user chưa có clinic.
        /// </summary>
        [HttpGet("my-clinic")]
        public async Task<IActionResult> GetMyClinic()
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await Mediator.Send(new GetMyClinicQuery(userId));
            return Ok(BaseResponse<GetMyClinicResponse?>.Ok(result));
        }

        /// <summary>
        /// Gán bác sĩ vào phòng khám.
        /// User phải là ClinicOwner của phòng khám đó mới có quyền gán.
        /// </summary>
        [HttpPost("{clinicId}/staff")]
        public async Task<IActionResult> AssignStaff(Guid clinicId, [FromBody] AssignStaffRequest request)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await Mediator.Send(new AssignStaffCommand(userId, clinicId, request));
            return Ok(BaseResponse<object>.Ok(null, "Gán bác sĩ thành công."));
        }

        /// <summary>
        /// ClinicOwner nộp lại hồ sơ sau khi bị Reject — có thể đổi số GKPD và/hoặc ảnh GKPD.
        /// Clinic sẽ chuyển về trạng thái Pending để Admin duyệt lại.
        /// </summary>
        [HttpPatch("{clinicId:guid}/resubmit")]
        public async Task<IActionResult> Resubmit(Guid clinicId, [FromBody] ResubmitClinicRequest request)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await Mediator.Send(new ResubmitClinicCommand(userId, clinicId, request));
            return Ok(BaseResponse<GetMyClinicResponse>.Ok(result, "Đã nộp lại hồ sơ. Vui lòng chờ Admin duyệt."));
        }
    }
}