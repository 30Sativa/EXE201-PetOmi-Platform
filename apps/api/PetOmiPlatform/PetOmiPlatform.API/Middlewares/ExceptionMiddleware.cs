using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Domain.Exceptions;
using System.Net;
using System.Text.Json;

namespace PetOmiPlatform.API.Middlewares
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;

        public ExceptionMiddleware(
            RequestDelegate next,
            ILogger<ExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                // Chỉ log Error với lỗi server, Warning với lỗi client
                if (ex is not NotFoundException
                    && ex is not ValidationException
                    && ex is not ForbiddenException
                    && ex is not ConflictException
                    && ex is UnauthorizedException
                    && ex is not DomainException)
                    _logger.LogError(ex, "Unhandled exception occurred");
                else
                    _logger.LogWarning("Client error: {Message}", ex.Message);

                await HandleExceptionAsync(context, ex);
            }
        }

        private static async Task HandleExceptionAsync(HttpContext context, Exception ex)
        {
            context.Response.ContentType = "application/json";

            // Map exception → statusCode + errors
            var (statusCode, errors) = ex switch
            {
                NotFoundException e => (StatusCodes.Status404NotFound,
                                            new List<string> { e.Message }),

                ValidationException e => (StatusCodes.Status400BadRequest,
                                            e.Errors.ToList()),  // có thể nhiều lỗi

                ForbiddenException e => (StatusCodes.Status403Forbidden,
                                            new List<string> { e.Message }),

                ConflictException e => (StatusCodes.Status409Conflict,
                                            new List<string> { e.Message }),
                UnauthorizedException e=> (StatusCodes.Status401Unauthorized,
                                            new List<string> { e.Message }),

                DomainException e => (StatusCodes.Status400BadRequest,
                                            new List<string> { e.Message }),

                _ => (StatusCodes.Status500InternalServerError,
                                            new List<string> { "An unexpected error occurred" })
            };

            context.Response.StatusCode = statusCode;

            // Dùng lại BaseResponse để nhất quán với các response khác
            var response = BaseResponse<object>.Fail(errors, statusCode);

            var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            await context.Response.WriteAsync(json);
        }
    }
}
