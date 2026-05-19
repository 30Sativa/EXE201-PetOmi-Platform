namespace PetOmiPlatform.Application.Features.Auth.DTOs.Response
{
    public class VerifyEmailResponse
    {
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public bool IsProfileCompleted { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
