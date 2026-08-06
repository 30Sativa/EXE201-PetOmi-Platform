namespace PetOmiPlatform.Application.Features.Admin.DTOs.Response;

public sealed class AdminSyntheticActivityResponse
{
    public string DatasetLabel { get; set; } = string.Empty;
    public string DataOrigin { get; set; } = string.Empty;
    public string Notice { get; set; } = string.Empty;
    public string FromDate { get; set; } = string.Empty;
    public string ToDate { get; set; } = string.Empty;
    public AdminSyntheticActivitySummary Summary { get; set; } = new();
    public List<AdminSyntheticDailyActivityItem> DailyActivity { get; set; } = new();
    public List<AdminSyntheticUserActivityItem> Users { get; set; } = new();
}

public sealed class AdminSyntheticActivitySummary
{
    public int UsersInDataset { get; set; }
    public int UsersWithPet { get; set; }
    public int UsersWhoCreatedPetInRange { get; set; }
    public int UsersWhoUsedServiceInRange { get; set; }
    public int QualifiedUsers { get; set; }
    public int PetsCreated { get; set; }
    public int ActiveUserDays { get; set; }
    public int OwnerMessages { get; set; }
    public int AiResponses { get; set; }
    public int MedicalNotes { get; set; }
    public int RemindersCreated { get; set; }
    public decimal AverageSessionMinutes { get; set; }
}

public sealed class AdminSyntheticDailyActivityItem
{
    public string Date { get; set; } = string.Empty;
    public int ActiveUsers { get; set; }
    public int PetsCreated { get; set; }
    public int OwnerMessages { get; set; }
    public int AiResponses { get; set; }
    public int MedicalNotes { get; set; }
    public int RemindersCreated { get; set; }
}

public sealed class AdminSyntheticUserActivityItem
{
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public bool IsSynthetic { get; set; } = true;
    public List<string> PetNames { get; set; } = new();
    public string? FirstPetCreatedAt { get; set; }
    public int ActiveDays { get; set; }
    public int OwnerMessages { get; set; }
    public int AiResponses { get; set; }
    public int MedicalNotes { get; set; }
    public int RemindersCreated { get; set; }
    public string? FirstActivityAt { get; set; }
    public string? LastActivityAt { get; set; }
    public bool CreatedPetInRange { get; set; }
    public bool UsedServiceInRange { get; set; }
    public bool QualifiedForScenario { get; set; }
}
