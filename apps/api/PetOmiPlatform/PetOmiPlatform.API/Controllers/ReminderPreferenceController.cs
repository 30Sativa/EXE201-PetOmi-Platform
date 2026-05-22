using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.ReminderPreference.Command;
using PetOmiPlatform.Application.Features.ReminderPreference.DTOs.Request;
using PetOmiPlatform.Application.Features.ReminderPreference.DTOs.Response;
using PetOmiPlatform.Application.Features.ReminderPreference.Query;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace PetOmiPlatform.API.Controllers
{
    [Route("api/reminders/preferences")]
    [ApiController]
    [Authorize]
    public class ReminderPreferenceController : BaseController
    {
        public ReminderPreferenceController(IMediator mediator) : base(mediator)
        {
        }

        private Guid GetCurrentUserId()
            => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        /// <summary>
        /// Lấy danh sách cấu hình reminder preference của user hiện tại.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetMyPreferences()
        {
            var userId = GetCurrentUserId();
            var result = await Mediator.Send(new GetUserPreferencesQuery(userId));
            return Ok(BaseResponse<List<ReminderPreferenceResponse>>.Ok(result));
        }

        /// <summary>
        /// Cập nhật hoặc tạo mới reminder preference cho một loại reminder cụ thể.
        /// </summary>
        [HttpPut]
        public async Task<IActionResult> UpsertPreference([FromBody] UpdateReminderPreferenceRequest request)
        {
            var userId = GetCurrentUserId();
            var result = await Mediator.Send(new UpsertReminderPreferenceCommand(userId, request));
            return Ok(BaseResponse<ReminderPreferenceResponse>.Ok(result));
        }
    }
}
