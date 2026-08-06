namespace PetOmiPlatform.Application.Features.Admin.DTOs.Response;

public sealed class AdminUserBehaviorResponse
{
    public string DatasetLabel { get; set; } = string.Empty;
    public string DataOrigin { get; set; } = string.Empty;
    public string FromDate { get; set; } = string.Empty;
    public string ToDate { get; set; } = string.Empty;
    public DateTime GeneratedAt { get; set; }
    public AdminUserBehaviorSummary Summary { get; set; } = new();
    public AdminChatBehaviorAnalytics ChatAnalytics { get; set; } = new();
    public List<AdminBehaviorFunnelItem> Funnel { get; set; } = new();
    public List<AdminFeatureAdoptionItem> FeatureAdoption { get; set; } = new();
    public List<AdminUserSegmentItem> Segments { get; set; } = new();
    public List<AdminBehaviorInsightItem> Insights { get; set; } = new();
    public List<AdminUserBehaviorDailyItem> DailyActivity { get; set; } = new();
    public List<AdminUserBehaviorItem> Users { get; set; } = new();
}

public sealed class AdminChatBehaviorAnalytics
{
    public int TotalQuestions { get; set; }
    public int UniqueChatUsers { get; set; }
    public decimal QuestionsPerChatUser { get; set; }
    public decimal QuestionsPerConversation { get; set; }
    public List<AdminChatTopicItem> TopTopics { get; set; } = new();
    public List<AdminTopQuestionItem> TopQuestions { get; set; } = new();
    public List<AdminTopChatUserItem> TopUsers { get; set; } = new();
}

public sealed class AdminChatTopicItem
{
    public string Intent { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public int Questions { get; set; }
    public int Users { get; set; }
    public decimal Percentage { get; set; }
}

public sealed class AdminTopQuestionItem
{
    public string Question { get; set; } = string.Empty;
    public string Intent { get; set; } = string.Empty;
    public string IntentLabel { get; set; } = string.Empty;
    public int AskCount { get; set; }
    public int Users { get; set; }
    public string LastAskedAt { get; set; } = string.Empty;
}

public sealed class AdminTopChatUserItem
{
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public int Questions { get; set; }
    public int Conversations { get; set; }
    public int ActiveDays { get; set; }
}

public sealed class AdminUserBehaviorSummary
{
    public int UsersInDataset { get; set; }
    public int NewUsers { get; set; }
    public int ActiveUsers { get; set; }
    public int ActivatedUsers { get; set; }
    public int ReturningUsers { get; set; }
    public int DormantUsers { get; set; }
    public int PetsCreated { get; set; }
    public int Conversations { get; set; }
    public int OwnerMessages { get; set; }
    public int AiResponses { get; set; }
    public int MedicalNotes { get; set; }
    public int RemindersCreated { get; set; }
    public int TotalSessions { get; set; }
    public decimal AverageSessionMinutes { get; set; }
    public decimal AverageDailyActiveUsers { get; set; }
    public decimal EngagementRate { get; set; }
    public decimal ActivationRate { get; set; }
    public decimal ReturnRate { get; set; }
}

public sealed class AdminBehaviorFunnelItem
{
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Users { get; set; }
    public int DropOffUsers { get; set; }
    public decimal ConversionRate { get; set; }
}

public sealed class AdminFeatureAdoptionItem
{
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Users { get; set; }
    public int Events { get; set; }
    public decimal AdoptionRate { get; set; }
}

public sealed class AdminUserSegmentItem
{
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Users { get; set; }
    public decimal Percentage { get; set; }
}

public sealed class AdminBehaviorInsightItem
{
    public string Severity { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string RecommendedAction { get; set; } = string.Empty;
    public string Metric { get; set; } = string.Empty;
}

public sealed class AdminUserBehaviorDailyItem
{
    public string Date { get; set; } = string.Empty;
    public int ActiveUsers { get; set; }
    public int Sessions { get; set; }
    public int Conversations { get; set; }
    public int PetsCreated { get; set; }
    public int OwnerMessages { get; set; }
    public int AiResponses { get; set; }
    public int MedicalNotes { get; set; }
    public int RemindersCreated { get; set; }
}

public sealed class AdminUserBehaviorItem
{
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public bool IsSynthetic { get; set; }
    public string AccountCreatedAt { get; set; } = string.Empty;
    public List<string> PetNames { get; set; } = new();
    public int ActiveDays { get; set; }
    public int Sessions { get; set; }
    public int Conversations { get; set; }
    public int OwnerMessages { get; set; }
    public int AiResponses { get; set; }
    public int MedicalNotes { get; set; }
    public int RemindersCreated { get; set; }
    public int FeaturesUsed { get; set; }
    public int TotalActions { get; set; }
    public int EngagementScore { get; set; }
    public string Segment { get; set; } = string.Empty;
    public string SegmentLabel { get; set; } = string.Empty;
    public string? FirstActivityAt { get; set; }
    public string? LastActivityAt { get; set; }
    public bool HasPet { get; set; }
    public bool UsedServiceInRange { get; set; }
    public bool IsReturning { get; set; }
}
