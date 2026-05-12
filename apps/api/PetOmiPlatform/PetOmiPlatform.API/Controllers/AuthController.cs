using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Feature.Auth.DTOs.Request;
using PetOmiPlatform.Application.Feature.Auth.DTOs.Response;
using PetOmiPlatform.Application.Features.Auth.Command;
using PetOmiPlatform.Application.Features.Auth.DTOs.Request;
using PetOmiPlatform.Application.Features.Auth.DTOs.Response;
using System.Security.Claims;

namespace PetOmiPlatform.API.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : BaseController
    {
        public AuthController(IMediator mediator) : base(mediator)
        {
        }


        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterRequest request)
        {
            var result = await Mediator.Send(new RegisterCommand(request));
            return Ok(BaseResponse<RegisterResponse>.Ok(result));
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest request)
        {
            var result = await Mediator.Send(new LoginCommand(request));
            return Ok(BaseResponse<LoginResponse>.Ok(result));
        }

        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
        {
            var result = await Mediator.Send(new RefreshTokenCommand(request));
            return Ok(BaseResponse<RefreshTokenResponse>.Ok(result));
        }

        [HttpPost("logout")]
        [Authorize] // ← cần JWT
        public async Task<IActionResult> Logout([FromBody] LogoutRequest request)
        {
            await Mediator.Send(new LogoutCommand(request));
            return Ok(BaseResponse<object>.Ok(null, "Đăng xuất thành công."));
        }

        [HttpPost("logout-all")]
        [Authorize]
        public async Task<IActionResult> LogoutAll()
        {
            // Lấy UserId từ JWT claim
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await Mediator.Send(new LogoutAllCommand(userId));
            return Ok(BaseResponse<object>.Ok(null, "Đăng xuất tất cả thiết bị thành công."));
        }
    }
}
