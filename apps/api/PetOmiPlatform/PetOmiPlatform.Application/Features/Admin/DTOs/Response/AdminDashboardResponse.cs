namespace PetOmiPlatform.Application.Features.Admin.DTOs.Response;

public class AdminDashboardResponse
{
    public AdminStatsSummary Summary { get; set; } = new();
    public AdminClinicStats ClinicStats { get; set; } = new();
    public AdminUserStats UserStats { get; set; } = new();
    public List<ClinicTrendItem> ClinicTrend { get; set; } = new();
    public List<UserTrendItem> UserTrend { get; set; } = new();
}

public class AdminStatsSummary
{
    public int TotalUsers { get; set; }
    public int TotalClinics { get; set; }
    public int TotalAppointments { get; set; }
    public int ActiveUsers { get; set; }
    public int InactiveUsers { get; set; }
}

public class AdminClinicStats
{
    public int Pending { get; set; }
    public int Approved { get; set; }
    public int Rejected { get; set; }
    public int Total { get; set; }
}

public class AdminUserStats
{
    public int Owners { get; set; }
    public int Vets { get; set; }
    public int Admins { get; set; }
}

public class ClinicTrendItem
{
    public string Date { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class UserTrendItem
{
    public string Date { get; set; } = string.Empty;
    public int Count { get; set; }
}
