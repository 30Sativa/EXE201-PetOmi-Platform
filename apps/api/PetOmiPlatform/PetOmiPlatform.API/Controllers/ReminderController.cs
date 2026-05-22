using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.Reminder.Command;
using PetOmiPlatform.Application.Features.Reminder.DTOs.Request;
using PetOmiPlatform.Application.Features.Reminder.DTOs.Response;
using PetOmiPlatform.Application.Features.Reminder.Query;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace PetOmiPlatform.API.Controllers
{
    [Route("api/reminders")]
    [ApiController]
    [Authorize]
    public class ReminderController : BaseController
    {
        public ReminderController(IMediator mediator) : base(mediator)
        {
        }

        private Guid GetCurrentUserId()
            => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        /// <summary>
        /// Lấy danh sách tất cả reminder của user hiện tại.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetMyReminders()
        {
            var userId = GetCurrentUserId();
            var result = await Mediator.Send(new GetUserRemindersQuery(userId));
            return Ok(BaseResponse<List<ReminderResponse>>.Ok(result));
        }

        /// <summary>
        /// Tạo reminder thủ công (Owner hoặc Vet).
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateReminder([FromBody] CreateReminderRequest request)
        {
            var userId = GetCurrentUserId();
            var result = await Mediator.Send(new CreateReminderCommand(userId, request));
            return Ok(BaseResponse<ReminderResponse>.Ok(result));
        }

        /// <summary>
        /// Bật/tắt một reminder.
        /// </summary>
        [HttpPost("{reminderId:guid}/toggle")]
        public async Task<IActionResult> ToggleReminder(Guid reminderId)
        {
            var userId = GetCurrentUserId();
            var result = await Mediator.Send(new ToggleReminderCommand(userId, reminderId));
            return Ok(BaseResponse<ReminderResponse>.Ok(result));
        }

        /// <summary>
        /// Bỏ qua (dismiss) một reminder.
        /// </summary>
        [HttpPost("{reminderId:guid}/dismiss")]
        public async Task<IActionResult> DismissReminder(Guid reminderId)
        {
            var userId = GetCurrentUserId();
            var result = await Mediator.Send(new DismissReminderCommand(userId, reminderId));
            return Ok(BaseResponse<ReminderResponse>.Ok(result));
        }
    }
}
