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
    /// Appointment management for clinic staff (ClinicOwner, PrimaryVet, Assistant).
    /// </summary>
    [Route("api/appointments")]
    [ApiController]
    [Authorize]
    public class AppointmentController : BaseController
    {
        public AppointmentController(IMediator mediator) : base(mediator) { }

        /// <summary>Get clinic appointments with pagination and date/status filters.</summary>
        [HttpGet]
        public async Task<IActionResult> GetClinicAppointments(
            [FromQuery] Guid clinicId,
            [FromQuery] string? status,
            [FromQuery] DateOnly? date,
            [FromQuery] string? search,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var result = await Mediator.Send(
                new GetClinicAppointmentsQuery(CurrentUserId, clinicId, status, date, search, page, pageSize));
            return Ok(BaseResponse<PagedData<AppointmentListItemResponse>>.Ok(result));
        }

        /// <summary>Create walk-in appointment for an existing pet profile.</summary>
        [HttpPost("walk-in")]
        public async Task<IActionResult> CreateWalkIn([FromBody] CreateWalkInRequest request)
        {
            var result = await Mediator.Send(
                new CreateWalkInAppointmentCommand(CurrentUserId, request));
            return Ok(BaseResponse<AppointmentResponse>.Ok(result));
        }

        /// <summary>Create temporary owner + pet and open a walk-in appointment in one step.</summary>
        [HttpPost("walk-in/guest-intake")]
        public async Task<IActionResult> CreateGuestWalkInIntake([FromBody] CreateGuestWalkInIntakeRequest request)
        {
            var result = await Mediator.Send(
                new CreateGuestWalkInIntakeCommand(CurrentUserId, request));
            return Ok(BaseResponse<GuestWalkInIntakeResponse>.Ok(result));
        }

        /// <summary>Confirm appointment (Pending to Confirmed).</summary>
        [HttpPost("{appointmentId:guid}/confirm")]
        public async Task<IActionResult> Confirm(Guid appointmentId)
        {
            var result = await Mediator.Send(
                new ConfirmAppointmentCommand(appointmentId, CurrentUserId));
            return Ok(BaseResponse<AppointmentResponse>.Ok(result));
        }

        /// <summary>Reject appointment (Pending to Rejected) with reason.</summary>
        [HttpPost("{appointmentId:guid}/reject")]
        public async Task<IActionResult> Reject(
            Guid appointmentId,
            [FromBody] RejectAppointmentRequest request)
        {
            var result = await Mediator.Send(
                new RejectAppointmentCommand(appointmentId, CurrentUserId, request));
            return Ok(BaseResponse<AppointmentResponse>.Ok(result));
        }

        /// <summary>Cancel appointment by clinic staff.</summary>
        [HttpPost("{appointmentId:guid}/cancel")]
        public async Task<IActionResult> Cancel(
            Guid appointmentId,
            [FromBody] CancelAppointmentRequest request)
        {
            var result = await Mediator.Send(
                new CancelAppointmentCommand(appointmentId, CurrentUserId, request));
            return Ok(BaseResponse<AppointmentResponse>.Ok(result));
        }

        /// <summary>Mark appointment completed (CheckedIn to Completed).</summary>
        [HttpPost("{appointmentId:guid}/complete")]
        public async Task<IActionResult> Complete(Guid appointmentId)
        {
            var result = await Mediator.Send(
                new CompleteAppointmentCommand(appointmentId, CurrentUserId));
            return Ok(BaseResponse<AppointmentResponse>.Ok(result));
        }

        /// <summary>Mark owner no-show for confirmed appointment.</summary>
        [HttpPost("{appointmentId:guid}/no-show")]
        public async Task<IActionResult> MarkNoShow(Guid appointmentId)
        {
            var result = await Mediator.Send(
                new MarkNoShowCommand(appointmentId, CurrentUserId));
            return Ok(BaseResponse<AppointmentResponse>.Ok(result));
        }

        /// <summary>Create emergency appointment (bypass slot check).</summary>
        [HttpPost("emergency")]
        public async Task<IActionResult> CreateEmergency([FromBody] CreateEmergencyRequest request)
        {
            var result = await Mediator.Send(
                new CreateEmergencyAppointmentCommand(CurrentUserId, request));
            return Ok(BaseResponse<AppointmentResponse>.Ok(result));
        }
    }
}
