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
    /// <summary>
    /// Quản lý lịch làm việc tuần của bác sĩ trong phòng khám.
    /// ClinicOwner thiết lập ca làm việc cho từng VetClinic (bác sĩ tại PK cụ thể).
    /// </summary>
    [Route("api/clinic/{clinicId:guid}/staff/{vetClinicId:guid}/schedule")]
    [ApiController]
    [Authorize]
    public class DoctorScheduleController : BaseController
    {
        public DoctorScheduleController(IMediator mediator) : base(mediator) { }

        /// <summary>Thêm ca làm việc mới cho bác sĩ (VetClinic) trong tuần.</summary>
        [HttpPost]
        public async Task<IActionResult> SetSchedule(
            Guid clinicId, Guid vetClinicId,
            [FromBody] SetDoctorScheduleRequest request)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await Mediator.Send(new SetDoctorScheduleCommand(userId, clinicId, vetClinicId, request));
            return Ok(BaseResponse<DoctorScheduleResponse>.Ok(result, "Thêm ca làm việc thành công."));
        }

        /// <summary>Xóa (deactivate) ca làm việc.</summary>
        [HttpDelete("{scheduleId:guid}")]
        public async Task<IActionResult> DeleteSchedule(
            Guid clinicId, Guid vetClinicId, Guid scheduleId)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await Mediator.Send(new DeleteDoctorScheduleCommand(userId, clinicId, scheduleId));
            return Ok(BaseResponse<object>.Ok(null, "Đã xóa ca làm việc."));
        }
    }

    /// <summary>Lấy lịch làm việc của toàn bộ bác sĩ trong clinic — không cần auth (public).</summary>
    [Route("api/clinic/{clinicId:guid}/schedule")]
    [ApiController]
    public class ClinicScheduleController : BaseController
    {
        public ClinicScheduleController(IMediator mediator) : base(mediator) { }

        /// <summary>Lấy lịch tuần của tất cả bác sĩ trong clinic — dùng để hiển thị cho người đặt lịch.</summary>
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetSchedules(Guid clinicId)
        {
            var result = await Mediator.Send(new GetDoctorSchedulesQuery(clinicId));
            return Ok(BaseResponse<IEnumerable<DoctorScheduleResponse>>.Ok(result));
        }
    }
}
