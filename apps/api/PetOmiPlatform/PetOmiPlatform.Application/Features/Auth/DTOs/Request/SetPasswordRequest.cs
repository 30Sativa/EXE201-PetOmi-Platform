namespace PetOmiPlatform.Application.Features.Auth.DTOs.Request
{
    public class SetPasswordRequest
    {
        public string NewPassword { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
