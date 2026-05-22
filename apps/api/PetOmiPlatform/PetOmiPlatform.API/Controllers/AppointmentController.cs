using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.Appointment.Command;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Request;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Response;
using PetOmiPlatform.Application.Features.Appointment.Query;
using System.Security.Claims;

namespace PetOmiPlatform.API.Controllers
{
    /// <summary>
    /// Appointment management cho Clinic Staff (ClinicOwner, PrimaryVet, Assistant).
    /// </summary>
    [Route("api/appointments")]
    [ApiController]
    [Authorize]
    public class AppointmentController : BaseController
    {
        public AppointmentController(IMediator mediator) : base(mediator) { }

        private Guid CurrentUserId =>
            Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        /// <summary>Xem danh sách lịch hẹn của clinic (phân trang, filter theo ngày và status).</summary>
        [HttpGet]
        public async Task<IActionResult> GetClinicAppointments(
            [FromQuery] Guid clinicId,
            [FromQuery] string? status,
            [FromQuery] DateOnly? date,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var result = await Mediator.Send(
                new GetClinicAppointmentsQuery(clinicId, status, date, page, pageSize));
            return Ok(BaseResponse<PagedData<AppointmentListItemResponse>>.Ok(result));
        }

        /// <summary>Tạo walk-in appointment cho khách đến trực tiếp.</summary>
        [HttpPost("walk-in")]
        public async Task<IActionResult> CreateWalkIn([FromBody] CreateWalkInRequest request)
        {
            var result = await Mediator.Send(
                new CreateWalkInAppointmentCommand(CurrentUserId, request));
            return Ok(BaseResponse<AppointmentResponse>.Ok(result));
        }

        /// <summary>Xác nhận lịch hẹn (Pending → Confirmed).</summary>
        [HttpPost("{appointmentId:guid}/confirm")]
        public async Task<IActionResult> Confirm(Guid appointmentId)
        {
            var result = await Mediator.Send(
                new ConfirmAppointmentCommand(appointmentId, CurrentUserId));
            return Ok(BaseResponse<AppointmentResponse>.Ok(result));
        }

        /// <summary>Từ chối lịch hẹn (Pending → Rejected) kèm lý do.</summary>
        [HttpPost("{appointmentId:guid}/reject")]
        public async Task<IActionResult> Reject(
            Guid appointmentId,
            [FromBody] RejectAppointmentRequest request)
        {
            var result = await Mediator.Send(
                new RejectAppointmentCommand(appointmentId, CurrentUserId, request));
            return Ok(BaseResponse<AppointmentResponse>.Ok(result));
        }

        /// <summary>Staff hủy lịch hẹn.</summary>
        [HttpPost("{appointmentId:guid}/cancel")]
        public async Task<IActionResult> Cancel(
            Guid appointmentId,
            [FromBody] CancelAppointmentRequest request)
        {
            var result = await Mediator.Send(
                new CancelAppointmentCommand(appointmentId, CurrentUserId, request));
            return Ok(BaseResponse<AppointmentResponse>.Ok(result));
        }

        /// <summary>Bác sĩ đánh dấu hoàn thành khám (Confirmed → Completed).</summary>
        [HttpPost("{appointmentId:guid}/complete")]
        public async Task<IActionResult> Complete(Guid appointmentId)
        {
            var result = await Mediator.Send(
                new CompleteAppointmentCommand(appointmentId, CurrentUserId));
            return Ok(BaseResponse<AppointmentResponse>.Ok(result));
        }
    }
}
