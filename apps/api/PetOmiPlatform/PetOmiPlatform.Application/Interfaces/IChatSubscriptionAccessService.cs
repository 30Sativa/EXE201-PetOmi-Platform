namespace PetOmiPlatform.Application.Interfaces;

public interface IChatSubscriptionAccessService
{
    Task<ChatSubscriptionAccessResult> GetAccessAsync(
        Guid ownerUserId,
        Guid? petId,
        CancellationToken cancellationToken = default);
}

public class ChatSubscriptionAccessResult
{
    public Guid? SubscriptionId { get; set; }
    public Guid PlanId { get; set; }
    public string PlanCode { get; set; } = string.Empty;
    public string PlanName { get; set; } = string.Empty;
    public bool IsPremium { get; set; }
    public int MonthlyMessageQuota { get; set; }
    public int? MonthlyTokenQuota { get; set; }
    public int UsedMessages { get; set; }
    public int UsedTokens { get; set; }
    public int RemainingMessages { get; set; }
    public DateTime ResetAt { get; set; }
    public DateTime? SubscriptionExpiresAt { get; set; }
    public int PriorityLevel { get; set; }
    public bool DeepRagEnabled { get; set; }
    public bool ImageUploadEnabled { get; set; }
    public int MaxImageUploadsPerMonth { get; set; }
    public bool CanSend => RemainingMessages > 0;
    public string? BlockReason { get; set; }
}
