using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Application.Features.Auth.DTOs.Response
{
    public class RefreshTokenResponse
    {
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public string ActiveRole { get; set; } = string.Empty;
        public List<string> Roles { get; set; } = new();
        public bool IsProfileCompleted { get; set; }
    }
}
