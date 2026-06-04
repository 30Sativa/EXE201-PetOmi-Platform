using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.Appointment.Command;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Request;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Response;
using PetOmiPlatform.Application.Features.Appointment.Query;

namespace PetOmiPlatform.API.Controllers
{
    /// <summary>
    /// Appointment endpoints dành cho Owner App:
    /// - Xem danh sách lịch hẹn của mình
    /// - Đặt lịch mới
    /// - Hủy / đổi lịch
    /// - Xem slot trống
    /// </summary>
    [Route("api/appointments/owner")]
    [ApiController]
    [Authorize]
    public class PublicAppointmentController : BaseController
    {
        public PublicAppointmentController(IMediator mediator) : base(mediator) { }

        /// <summary>Owner xem danh sách lịch hẹn của mình (phân trang).</summary>
        [HttpGet]
        public async Task<IActionResult> GetMyAppointments(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var result = await Mediator.Send(
                new GetOwnerAppointmentsQuery(CurrentUserId, page, pageSize));
            return Ok(BaseResponse<PagedData<AppointmentListItemResponse>>.Ok(result));
        }

        /// <summary>Xem slot trống của clinic trong ngày. Gọi trước khi đặt lịch.</summary>
        [HttpGet("available-slots")]
        public async Task<IActionResult> GetAvailableSlots(
            [FromQuery] Guid clinicId,
            [FromQuery] DateOnly date,
            [FromQuery] Guid? serviceId,
            [FromQuery] Guid? vetClinicId = null)
        {
            var result = await Mediator.Send(
                new GetAvailableSlotsQuery(clinicId, date, serviceId, vetClinicId));
            return Ok(BaseResponse<List<AvailableSlotResponse>>.Ok(result));
        }

        /// <summary>Lấy danh sách bác sĩ active tại clinic (để owner chọn bác sĩ khi đặt lịch).</summary>
        [HttpGet("doctors")]
        public async Task<IActionResult> GetClinicDoctors([FromQuery] Guid clinicId)
        {
            var result = await Mediator.Send(new GetClinicDoctorsQuery(clinicId));
            return Ok(BaseResponse<List<ClinicDoctorResponse>>.Ok(result));
        }

        /// <summary>Owner đặt lịch hẹn tại clinic.</summary>
        [HttpPost("book")]
        public async Task<IActionResult> Book([FromBody] BookAppointmentRequest request)
        {
            var result = await Mediator.Send(
                new BookAppointmentCommand(CurrentUserId, request));
            return Ok(BaseResponse<AppointmentResponse>.Ok(result));
        }

        /// <summary>Owner hủy lịch hẹn (áp dụng late cancellation policy).</summary>
        [HttpPost("{appointmentId:guid}/cancel")]
        public async Task<IActionResult> Cancel(
            Guid appointmentId,
            [FromBody] CancelAppointmentRequest request)
        {
            var result = await Mediator.Send(
                new CancelAppointmentCommand(appointmentId, CurrentUserId, request));
            return Ok(BaseResponse<AppointmentResponse>.Ok(result));
        }

        /// <summary>Owner đổi lịch hẹn (appointment sẽ về Pending để clinic xác nhận lại).</summary>
        [HttpPost("{appointmentId:guid}/reschedule")]
        public async Task<IActionResult> Reschedule(
            Guid appointmentId,
            [FromBody] RescheduleAppointmentRequest request)
        {
            var result = await Mediator.Send(
                new RescheduleAppointmentCommand(appointmentId, CurrentUserId, request));
            return Ok(BaseResponse<AppointmentResponse>.Ok(result));
        }
    }
}
