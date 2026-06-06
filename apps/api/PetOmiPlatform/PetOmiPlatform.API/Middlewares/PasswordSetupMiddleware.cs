using System.Security.Claims;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.API.Middlewares
{
    public class PasswordSetupMiddleware
    {
        private static readonly PathString[] AllowedPaths =
        [
            new("/api/auth/me"),
            new("/api/auth/set-password"),
            new("/api/auth/logout"),
            new("/api/auth/logout-all"),
            new("/api/auth/refresh-token")
        ];

        private readonly RequestDelegate _next;

        public PasswordSetupMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, IUserRepository userRepository)
        {
            if (context.User.Identity?.IsAuthenticated != true ||
                IsAllowedPath(context.Request.Path))
            {
                await _next(context);
                return;
            }

            var userIdValue = context.User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(userIdValue, out var userId))
            {
                await _next(context);
                return;
            }

            var user = await userRepository.GetByIdAsync(userId);

            if (user is { HasPassword: false })
            {
                throw new ForbiddenException("Vui lòng thiết lập mật khẩu trước khi tiếp tục.");
            }

            await _next(context);
        }

        private static bool IsAllowedPath(PathString requestPath)
        {
            return AllowedPaths.Any(path => requestPath.StartsWithSegments(path));
        }
    }
}
