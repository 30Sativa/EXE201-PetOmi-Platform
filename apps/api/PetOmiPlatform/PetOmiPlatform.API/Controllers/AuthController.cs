using MediatR;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Exceptions;
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

        /// <summary>
        /// Đăng ký tài khoản mới. User được gán role Owner mặc định và hệ thống gửi email xác minh.
        /// </summary>
        [HttpPost("register")]

        public async Task<IActionResult> Register(RegisterRequest request)
        {
            var result = await Mediator.Send(new RegisterCommand(request));
            return Ok(BaseResponse<RegisterResponse>.Ok(result));
        }

        /// <summary>
        /// Đăng nhập bằng email/password, tạo access token, refresh token, device và session.
        /// </summary>
        [HttpPost("login")]

        public async Task<IActionResult> Login(LoginRequest request)
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
            var userAgent = Request.Headers["User-Agent"].ToString();
            if (string.IsNullOrEmpty(userAgent))
            {
                userAgent = "Unknown";
            }
            var result = await Mediator.Send(new LoginCommand(ipAddress, userAgent, request));
            return Ok(BaseResponse<LoginResponse>.Ok(result));  
        }

        /// <summary>
        /// Làm mới access token bằng refresh token còn hiệu lực.
        /// </summary>
        [HttpPost("refresh-token")]

        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
        {
            var result = await Mediator.Send(new RefreshTokenCommand(request));
            return Ok(BaseResponse<RefreshTokenResponse>.Ok(result));
        }

        /// <summary>
        /// Đăng xuất session hiện tại bằng refresh token, thu hồi token liên quan.
        /// </summary>
        [HttpPost("logout")]
        [Authorize] // ← cần JWT

        public async Task<IActionResult> Logout([FromBody] LogoutRequest request)
        {
            await Mediator.Send(new LogoutCommand(request));
            return Ok(BaseResponse<object>.Ok(null, "Đăng xuất thành công."));
        }

        /// <summary>
        /// Đăng xuất tất cả thiết bị của user đang đăng nhập.
        /// </summary>
        [HttpPost("logout-all")]
        [Authorize]

        public async Task<IActionResult> LogoutAll()
        {
            // Lấy UserId từ JWT claim
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await Mediator.Send(new LogoutAllCommand(userId));
            return Ok(BaseResponse<object>.Ok(null, "Đăng xuất tất cả thiết bị thành công."));
        }
        /// <summary>
        /// Xác minh email bằng token được gửi qua email.
        /// </summary>
        [HttpGet("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromQuery] string token)
        {
            await Mediator.Send(new VerifyEmailCommand(token));
            return Ok(BaseResponse<object>.Ok(null, "Xác minh email thành công."));
        }

        /// <summary>
        /// Gửi email đặt lại mật khẩu nếu email tồn tại trong hệ thống.
        /// </summary>
        [HttpPost("forgot-password")]

        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            await Mediator.Send(new ForgotPasswordCommand(request));
            return Ok(BaseResponse<object>.Ok(null, "Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu."));
        }

        /// <summary>
        /// Đặt lại mật khẩu bằng token reset password hợp lệ.
        /// </summary>
        [HttpPost("reset-password")]

        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            await Mediator.Send(new ResetPasswordCommand(request));
            return Ok(BaseResponse<object>.Ok(null, "Đặt lại mật khẩu thành công."));
        }


        /// <summary>
        /// Bật hoặc tắt vai trò được chỉ định cho người dùng hiện tại trong ngữ cảnh của một phòng khám cụ thể.
        /// </summary>
        /// <remarks>
        /// Người dùng phải được xác thực để gọi phương thức này. Thao tác sẽ được thực hiện
        /// trong ngữ cảnh của người dùng hiện đang đăng nhập.
        /// </remarks>
        /// <param name="request">
        /// Yêu cầu chứa vai trò cần bật/tắt và mã định danh của phòng khám. Không được để null.
        /// </param>
        /// <returns>
        /// Một IActionResult chứa kết quả của thao tác bật/tắt vai trò.
        /// Trả về phản hồi thành công kèm thông tin vai trò đã được cập nhật.
        /// </returns>

        [HttpPost("toggle-role")]
        [Authorize]
        public async Task<IActionResult> ToggleRole([FromBody] ToggleRoleRequest request)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await Mediator.Send(new ToggleRoleCommand(userId, request.TargetRole, request.ClinicId));
            return Ok(BaseResponse<ToggleRoleResponse>.Ok(result));
        }

        /// <summary>
        /// Redirect user đến Google consent screen
        /// </summary>
        [HttpGet("google/login")]
        public IActionResult GoogleLogin()
        {
            var redirectUrl = Url.Action(nameof(GoogleCallback), "Auth", null, Request.Scheme);
            var properties = new AuthenticationProperties { RedirectUri = redirectUrl };
            return Challenge(properties, "Google");
        }

        /// <summary>
        /// Google callback — nhận code, xử lý login/register, trả JWT
        /// </summary>
        [HttpGet("google/callback")]
        public async Task<IActionResult> GoogleCallback()
        {
            // Lấy access token từ Google authentication result
            var authenticateResult = await HttpContext.AuthenticateAsync("Google");

            if (!authenticateResult.Succeeded)
                throw new UnauthorizedException("Xác thực Google thất bại.");

            var accessToken = authenticateResult.Properties?.GetTokenValue("access_token")
                ?? throw new UnauthorizedException("Không lấy được access token từ Google.");

            var result = await Mediator.Send(new GoogleLoginCommand(accessToken));
            return Ok(BaseResponse<LoginResponse>.Ok(result));
        }
    }
}
