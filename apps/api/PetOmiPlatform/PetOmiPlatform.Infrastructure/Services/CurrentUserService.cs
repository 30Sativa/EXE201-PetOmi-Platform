using Microsoft.AspNetCore.Http;
using PetOmiPlatform.Application.Interfaces;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Text;

namespace PetOmiPlatform.Infrastructure.Services
{
    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public Guid? UserId
        {
            get
            {
                var value = _httpContextAccessor.HttpContext?
                    .User.FindFirstValue(ClaimTypes.NameIdentifier);
                return value != null ? Guid.Parse(value) : null;
            }
        }

        public string? Email =>
            _httpContextAccessor.HttpContext?
                .User.FindFirstValue(ClaimTypes.Email);

        public string? Role =>
            _httpContextAccessor.HttpContext?
                .User.FindFirstValue("activeRole");

        public bool IsAuthenticated =>
            _httpContextAccessor.HttpContext?
                .User.Identity?.IsAuthenticated ?? false;

        public string? IpAddress =>
            _httpContextAccessor.HttpContext?
                .Connection.RemoteIpAddress?.ToString();

        public string? UserAgent =>
            _httpContextAccessor.HttpContext?
                .Request.Headers["User-Agent"].ToString();
    }
}
