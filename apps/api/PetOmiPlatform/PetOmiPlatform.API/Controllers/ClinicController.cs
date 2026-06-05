using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Request;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;

namespace PetOmiPlatform.API.Controllers
{
    /// <summary>
    /// API quản lý hồ sơ, nhân sự và dịch vụ của phòng khám.
    /// </summary>
    [Route("api/clinic")]
    [ApiController]
    [Authorize]
    public class ClinicController : BaseController
    {
        public ClinicController(IMediator mediator) : base(mediator) { }

        /// <summary>Tạo phòng khám mới ở trạng thái Pending.</summary>
        [HttpPost]
        public async Task<IActionResult> CreateClinic([FromBody] CreateClinicRequest request)
        {
            var result = await Mediator.Send(new CreateClinicCommand(CurrentUserId, request));
            return Ok(BaseResponse<CreateClinicResponse>.Ok(result, "Đăng ký phòng khám thành công. Vui lòng chờ Admin duyệt."));
        }

        /// <summary>Lấy thông tin clinic hiện tại của user đang đăng nhập.</summary>
        [HttpGet("my-clinic")]
        public async Task<IActionResult> GetMyClinic()
        {
            var result = await Mediator.Send(new GetMyClinicQuery(CurrentUserId));
            return Ok(BaseResponse<GetMyClinicResponse?>.Ok(result));
        }

        /// <summary>Gán staff vào phòng khám (chỉ ClinicOwner).</summary>
        [HttpPost("{clinicId:guid}/staff")]
        public async Task<IActionResult> AssignStaff(Guid clinicId, [FromBody] AssignStaffRequest request)
        {
            await Mediator.Send(new AssignStaffCommand(CurrentUserId, clinicId, request));
            return Ok(BaseResponse<object>.Ok(null, "Gán staff thành công."));
        }

        /// <summary>Cập nhật vai trò staff (PrimaryVet/Assistant), chỉ ClinicOwner.</summary>
        [HttpPut("{clinicId:guid}/staff/{vetClinicId:guid}/role")]
        public async Task<IActionResult> UpdateStaffRole(
            Guid clinicId,
            Guid vetClinicId,
            [FromBody] UpdateClinicStaffRoleRequest request)
        {
            var result = await Mediator.Send(new UpdateClinicStaffRoleCommand(CurrentUserId, clinicId, vetClinicId, request));
            return Ok(BaseResponse<bool>.Ok(result, "Cập nhật vai trò staff thành công."));
        }

        /// <summary>Ngừng hoạt động staff (soft deactivate), chỉ ClinicOwner.</summary>
        [HttpPost("{clinicId:guid}/staff/{vetClinicId:guid}/deactivate")]
        public async Task<IActionResult> DeactivateStaff(
            Guid clinicId,
            Guid vetClinicId,
            [FromBody] DeactivateClinicStaffRequest request)
        {
            var result = await Mediator.Send(new DeactivateClinicStaffCommand(CurrentUserId, clinicId, vetClinicId, request));
            return Ok(BaseResponse<bool>.Ok(result, "Đã ngừng hoạt động staff."));
        }

        /// <summary>ClinicOwner nộp lại hồ sơ sau khi bị Reject.</summary>
        [HttpPatch("{clinicId:guid}/resubmit")]
        public async Task<IActionResult> Resubmit(Guid clinicId, [FromBody] ResubmitClinicRequest request)
        {
            var result = await Mediator.Send(new ResubmitClinicCommand(CurrentUserId, clinicId, request));
            return Ok(BaseResponse<GetMyClinicResponse>.Ok(result, "Đã nộp lại hồ sơ. Vui lòng chờ Admin duyệt."));
        }

        /// <summary>Cập nhật thông tin phòng khám (chỉ khi Approved).</summary>
        [HttpPut("{clinicId:guid}/info")]
        public async Task<IActionResult> UpdateInfo(Guid clinicId, [FromBody] UpdateClinicInfoRequest request)
        {
            var result = await Mediator.Send(new UpdateClinicInfoCommand(CurrentUserId, clinicId, request));
            return Ok(BaseResponse<GetMyClinicResponse>.Ok(result, "Cập nhật thông tin phòng khám thành công."));
        }

        /// <summary>Cập nhật tọa độ GPS và buffer time cho appointment.</summary>
        [HttpPatch("{clinicId:guid}/location")]
        public async Task<IActionResult> UpdateLocation(Guid clinicId, [FromBody] UpdateClinicLocationRequest request)
        {
            var result = await Mediator.Send(new UpdateClinicLocationCommand(CurrentUserId, clinicId, request));
            return Ok(BaseResponse<ClinicLocationResponse>.Ok(result, "Cập nhật vị trí phòng khám thành công."));
        }

        /// <summary>Lấy public profile của phòng khám và danh sách dịch vụ đang active.</summary>
        [HttpGet("{clinicId:guid}/public")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublicProfile(Guid clinicId)
        {
            var result = await Mediator.Send(new GetClinicPublicQuery(clinicId));
            return Ok(BaseResponse<ClinicPublicResponse>.Ok(result));
        }

        /// <summary>Lấy danh sách bác sĩ/staff active của clinic để FE quản lý nội bộ.</summary>
        [HttpGet("{clinicId:guid}/doctors")]
        public async Task<IActionResult> GetClinicDoctors(Guid clinicId)
        {
            var result = await Mediator.Send(new GetClinicDoctorsQuery(CurrentUserId, clinicId));
            return Ok(BaseResponse<IReadOnlyList<ClinicDoctorListItemResponse>>.Ok(result));
        }

        /// <summary>Thêm dịch vụ mới vào phòng khám.</summary>
        /// <summary>Tim pet da tung co lich tai clinic de tao walk-in/cap cuu cho ho so co san.</summary>
        [HttpGet("{clinicId:guid}/pets/search")]
        public async Task<IActionResult> SearchClinicPets(
            Guid clinicId,
            [FromQuery] string? search,
            [FromQuery] int limit = 20)
        {
            var result = await Mediator.Send(new SearchClinicPetsQuery(CurrentUserId, clinicId, search, limit));
            return Ok(BaseResponse<IReadOnlyList<ClinicPetSearchItemResponse>>.Ok(result));
        }

        [HttpPost("{clinicId:guid}/services")]
        public async Task<IActionResult> AddService(Guid clinicId, [FromBody] AddClinicServiceRequest request)
        {
            var result = await Mediator.Send(new AddClinicServiceCommand(CurrentUserId, clinicId, request));
            return Ok(BaseResponse<ClinicServiceResponse>.Ok(result, "Thêm dịch vụ thành công."));
        }

        /// <summary>Cập nhật thông tin dịch vụ.</summary>
        [HttpPut("{clinicId:guid}/services/{serviceId:guid}")]
        public async Task<IActionResult> UpdateService(
            Guid clinicId,
            Guid serviceId,
            [FromBody] UpdateClinicServiceRequest request)
        {
            var result = await Mediator.Send(new UpdateClinicServiceCommand(CurrentUserId, clinicId, serviceId, request));
            return Ok(BaseResponse<ClinicServiceResponse>.Ok(result, "Cập nhật dịch vụ thành công."));
        }

        /// <summary>Xóa mềm dịch vụ (IsActive = false).</summary>
        [HttpDelete("{clinicId:guid}/services/{serviceId:guid}")]
        public async Task<IActionResult> DeleteService(Guid clinicId, Guid serviceId)
        {
            await Mediator.Send(new DeleteClinicServiceCommand(CurrentUserId, clinicId, serviceId));
            return Ok(BaseResponse<object>.Ok(null, "Đã xóa dịch vụ."));
        }
    }
}
