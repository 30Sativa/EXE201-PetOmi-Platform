namespace PetOmiPlatform.Application.Common.Models;

public class AdminUserQueryResult
{
    public List<AdminUserItem> Items { get; set; } = new();
    public int TotalCount { get; set; }
}

public class AdminUserItem
{
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public bool EmailVerified { get; set; }
    public bool IsActive { get; set; }
    public bool IsProfileCompleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public string? FullName { get; set; }
    public List<string> Roles { get; set; } = new();
}
