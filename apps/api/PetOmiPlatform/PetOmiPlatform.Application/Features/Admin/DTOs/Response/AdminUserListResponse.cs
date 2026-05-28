namespace PetOmiPlatform.Application.Features.Admin.DTOs.Response;

public class AdminUserListResponse
{
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public bool EmailVerified { get; set; }
    public bool IsActive { get; set; }
    public bool IsProfileCompleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public List<string> Roles { get; set; } = new();
}
