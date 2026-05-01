using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Features.Auth.DTOs.Response
{
    public class LoginResponse
    {
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;

        public Guid UserId { get; set; }
        public string Email { get; set; } = string.Empty;
    }
}
