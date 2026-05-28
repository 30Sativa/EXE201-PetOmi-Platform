using System.Collections.Generic;

namespace PetOmiPlatform.Application.Features.Auth.DTOs.Response
{
    public class VerifyEmailResponse
    {
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public string ActiveRole { get; set; } = string.Empty;
        public List<string> Roles { get; set; } = new();
        public string Email { get; set; } = string.Empty;
        public bool IsProfileCompleted { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
