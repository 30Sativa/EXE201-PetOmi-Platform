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

        // ─────────────────────────────────────────────────────────────
        //  SLICE 1: Registration flow
        // ─────────────────────────────────────────────────────────────

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

        // ─────────────────────────────────────────────────────────────
        //  SLICE 2: Profile + Services
        // ─────────────────────────────────────────────────────────────

        /// <summary>
        /// ClinicOwner cập nhật thông tin phòng khám (logo, địa chỉ, giờ mở cửa, mô tả).
        /// Chỉ hoạt động khi clinic đã Approved.
        /// </summary>
        [HttpPut("{clinicId:guid}/info")]
        public async Task<IActionResult> UpdateInfo(Guid clinicId, [FromBody] UpdateClinicInfoRequest request)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await Mediator.Send(new UpdateClinicInfoCommand(userId, clinicId, request));
            return Ok(BaseResponse<GetMyClinicResponse>.Ok(result, "Cập nhật thông tin phòng khám thành công."));
        }

        /// <summary>
        /// ClinicOwner cập nhật tọa độ GPS (lat/lng) và buffer time cho appointment.
        /// </summary>
        [HttpPatch("{clinicId:guid}/location")]
        public async Task<IActionResult> UpdateLocation(Guid clinicId, [FromBody] UpdateClinicLocationRequest request)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await Mediator.Send(new UpdateClinicLocationCommand(userId, clinicId, request));
            return Ok(BaseResponse<ClinicLocationResponse>.Ok(result, "Cập nhật vị trí phòng khám thành công."));
        }

        /// <summary>
        /// Lấy public profile của phòng khám kèm danh sách dịch vụ đang hoạt động.
        /// Không yêu cầu đăng nhập — Owner app dùng để hiển thị cho người dùng.
        /// </summary>
        [HttpGet("{clinicId:guid}/public")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublicProfile(Guid clinicId)
        {
            var result = await Mediator.Send(new GetClinicPublicQuery(clinicId));
            return Ok(BaseResponse<ClinicPublicResponse>.Ok(result));
        }

        /// <summary>
        /// Thêm dịch vụ mới vào phòng khám.
        /// Clinic phải Approved. DurationMins quan trọng để hệ thống tính slot đặt lịch.
        /// </summary>
        [HttpPost("{clinicId:guid}/services")]
        public async Task<IActionResult> AddService(Guid clinicId, [FromBody] AddClinicServiceRequest request)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await Mediator.Send(new AddClinicServiceCommand(userId, clinicId, request));
            return Ok(BaseResponse<ClinicServiceResponse>.Ok(result, "Thêm dịch vụ thành công."));
        }

        /// <summary>
        /// Cập nhật thông tin dịch vụ (partial update — chỉ truyền field muốn đổi).
        /// </summary>
        [HttpPut("{clinicId:guid}/services/{serviceId:guid}")]
        public async Task<IActionResult> UpdateService(
            Guid clinicId, Guid serviceId, [FromBody] UpdateClinicServiceRequest request)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await Mediator.Send(new UpdateClinicServiceCommand(userId, clinicId, serviceId, request));
            return Ok(BaseResponse<ClinicServiceResponse>.Ok(result, "Cập nhật dịch vụ thành công."));
        }

        /// <summary>
        /// Xóa (soft-delete) dịch vụ — IsActive = false.
        /// Dịch vụ đã xóa không hiển thị trên public profile và không thể đặt lịch.
        /// </summary>
        [HttpDelete("{clinicId:guid}/services/{serviceId:guid}")]
        public async Task<IActionResult> DeleteService(Guid clinicId, Guid serviceId)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await Mediator.Send(new DeleteClinicServiceCommand(userId, clinicId, serviceId));
            return Ok(BaseResponse<object>.Ok(null, "Đã xóa dịch vụ."));
        }
    }
}