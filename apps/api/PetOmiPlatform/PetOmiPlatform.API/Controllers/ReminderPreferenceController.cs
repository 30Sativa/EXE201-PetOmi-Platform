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

        /// <summary>
        /// Lấy danh sách cấu hình reminder preference của user hiện tại.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetMyPreferences()
        {
            var result = await Mediator.Send(new GetUserPreferencesQuery(CurrentUserId));
            return Ok(BaseResponse<List<ReminderPreferenceResponse>>.Ok(result));
        }

        /// <summary>
        /// Cập nhật hoặc tạo mới reminder preference cho một loại reminder cụ thể.
        /// </summary>
        [HttpPut]
        public async Task<IActionResult> UpsertPreference([FromBody] UpdateReminderPreferenceRequest request)
        {
            var result = await Mediator.Send(new UpsertReminderPreferenceCommand(CurrentUserId, request));
            return Ok(BaseResponse<ReminderPreferenceResponse>.Ok(result));
        }
    }
}
