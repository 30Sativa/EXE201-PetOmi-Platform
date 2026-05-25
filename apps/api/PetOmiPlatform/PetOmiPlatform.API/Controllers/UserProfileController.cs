using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.UserProfile.Command;
using PetOmiPlatform.Application.Features.UserProfile.DTOs.Request;
using PetOmiPlatform.Application.Features.UserProfile.DTOs.Response;
using PetOmiPlatform.Application.Features.UserProfile.Query;
using System;

namespace PetOmiPlatform.API.Controllers
{
    [Route("api/profile")]
    [ApiController]
    public class UserProfileController : BaseController
    {
        public UserProfileController(IMediator mediator) : base(mediator) { }

        /// <summary>
        /// Lấy hồ sơ cá nhân của user đang đăng nhập.
        /// </summary>
        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetMyProfile()
        {
            var result = await Mediator.Send(new GetUserProfileQuery(CurrentUserId));
            return Ok(BaseResponse<UserProfileResponse>.Ok(result));
        }

        /// <summary>
        /// Hoàn thiện hồ sơ cá nhân — dùng khi user mới đăng ký và verify email xong.
        /// Sau khi hoàn thành, IsProfileCompleted sẽ được set = true.
        /// </summary>
        [HttpPost("complete")]
        [Authorize]
        public async Task<IActionResult> CompleteProfile([FromBody] CreateUserProfileRequest request)
        {
            var result = await Mediator.Send(new CompleteUserProfileCommand(CurrentUserId, request));
            return Ok(BaseResponse<CompleteProfileResponse>.Ok(result));
        }

        /// <summary>
        /// Tạo hồ sơ cá nhân cho user.
        /// </summary>
        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateProfile([FromBody] CreateUserProfileRequest request)
        {
            var result = await Mediator.Send(new CreateUserProfileCommand(CurrentUserId, request));
            return Ok(BaseResponse<UserProfileResponse>.Ok(result));
        }

        /// <summary>
        /// Cập nhật hồ sơ cá nhân (thông tin, địa chỉ, avatar, v.v.).
        /// </summary>
        [HttpPut]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateUserProfileRequest request)
        {
            var result = await Mediator.Send(new UpdateUserProfileCommand(CurrentUserId, request));
            return Ok(BaseResponse<UserProfileResponse>.Ok(result));
        }
    }
}
