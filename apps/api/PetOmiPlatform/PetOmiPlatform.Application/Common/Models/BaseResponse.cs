using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Common.Models
{
    public class BaseResponse<T>
    {
        public bool Success { get; set; }
        public int StatusCode { get; set; }
        public string? Message { get; set; }
        public T? Data { get; set; }
        public List<string>? Errors { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public static BaseResponse<T> Ok(T data, string message = "Success")
            => new()
            {
                Success = true,
                StatusCode = 200,
                Message = message,
                Data = data
            };

        public static BaseResponse<T> Fail(string error, int statusCode = 400)
            => new()
            {
                Success = false,
                StatusCode = statusCode,
                Errors = new List<string> { error }
            };

        public static BaseResponse<T> Fail(List<string> errors, int statusCode = 400)
            => new()
            {
                Success = false,
                StatusCode = statusCode,
                Errors = errors
            };
    }
}
