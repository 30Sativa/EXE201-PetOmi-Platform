using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Admin.DTOs.Response;

public class AdminAlertsResponse
{
    public List<AdminAlertItemResponse> Items { get; set; } = new();
    public AdminAlertStatsResponse Stats { get; set; } = new();
}

public class AdminAlertItemResponse
{
    public string AlertId { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public ClinicListItemResponse? Clinic { get; set; }
    public AdminUserListResponse? User { get; set; }
}

public class AdminAlertStatsResponse
{
    public int Total { get; set; }
    public int High { get; set; }
    public int Medium { get; set; }
    public int Low { get; set; }
}
