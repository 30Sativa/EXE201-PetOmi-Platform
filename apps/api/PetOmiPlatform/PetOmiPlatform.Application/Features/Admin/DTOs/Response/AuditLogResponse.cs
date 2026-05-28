namespace PetOmiPlatform.Application.Features.Admin.DTOs.Response;

public class AuditLogItemResponse
{
    public Guid AuditLogId { get; set; }
    public Guid? UserId { get; set; }
    public string? UserEmail { get; set; }
    public string? UserFullName { get; set; }
    public string Action { get; set; } = null!;
    public string? EntityType { get; set; }
    public Guid? EntityId { get; set; }
    public string Severity { get; set; } = null!;
    public string Category { get; set; } = null!;
    public string? IpAddress { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AuditLogListResponse
{
    public List<AuditLogItemResponse> Items { get; set; } = new();
    public AuditLogStats Stats { get; set; } = new();
}

public class AuditLogStats
{
    public int TotalLogs { get; set; }
    public int TodayLogs { get; set; }
    public int ThisWeekLogs { get; set; }
    public int ClinicActions { get; set; }
    public int RoleActions { get; set; }
    public int UserActions { get; set; }
}
