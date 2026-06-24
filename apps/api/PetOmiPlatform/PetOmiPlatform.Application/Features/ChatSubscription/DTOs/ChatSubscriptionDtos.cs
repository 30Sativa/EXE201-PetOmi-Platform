namespace PetOmiPlatform.Application.Features.ChatSubscription.DTOs;

public class ChatSubscriptionPlanResponse
{
    public Guid PlanId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal PriceMonthly { get; set; }
    public int BillingCycleDays { get; set; }
    public int MonthlyMessageQuota { get; set; }
    public int? MonthlyTokenQuota { get; set; }
    public int PriorityLevel { get; set; }
    public bool DeepRagEnabled { get; set; }
    public bool ImageUploadEnabled { get; set; }
    public int MaxImageUploadsPerMonth { get; set; }
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
}

public class ChatSubscriptionUsageResponse
{
    public int UsedMessages { get; set; }
    public int RemainingMessages { get; set; }
    public int MonthlyMessageQuota { get; set; }
    public int? MonthlyTokenQuota { get; set; }
    public int UsedTokens { get; set; }
    public DateTime ResetAt { get; set; }
}

public class ChatSubscriptionCapabilitiesResponse
{
    public int PriorityLevel { get; set; }
    public bool DeepRagEnabled { get; set; }
    public bool ImageUploadEnabled { get; set; }
    public int MaxImageUploadsPerMonth { get; set; }
}

public class OwnerPetChatSubscriptionResponse
{
    public Guid SubscriptionId { get; set; }
    public Guid PetId { get; set; }
    public string PetName { get; set; } = string.Empty;
    public string PlanCode { get; set; } = string.Empty;
    public string PlanName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime StartsAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsUsable { get; set; }
}

public class ChatSubscriptionStatusResponse
{
    public string CurrentPlanCode { get; set; } = string.Empty;
    public string CurrentPlanName { get; set; } = string.Empty;
    public Guid? SelectedPetId { get; set; }
    public Guid? SubscriptionId { get; set; }
    public bool IsPremium { get; set; }
    public DateTime? SubscriptionExpiresAt { get; set; }
    public bool CanSend { get; set; }
    public string? BlockReason { get; set; }
    public ChatSubscriptionUsageResponse Usage { get; set; } = new();
    public ChatSubscriptionCapabilitiesResponse Capabilities { get; set; } = new();
    public List<ChatSubscriptionPlanResponse> Plans { get; set; } = new();
    public List<OwnerPetChatSubscriptionResponse> OwnerPetSubscriptions { get; set; } = new();
}

public class CreateChatSubscriptionPaymentRequest
{
    public string PlanCode { get; set; } = "premium";
    public Guid PetId { get; set; }
}

public class ChatSubscriptionPaymentResponse
{
    public Guid PaymentId { get; set; }
    public Guid PetId { get; set; }
    public string PetName { get; set; } = string.Empty;
    public string PlanCode { get; set; } = string.Empty;
    public string PlanName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    // Gia goc truoc khi giam (de FE hien gia gach ngang). = Amount neu khong giam.
    public decimal OriginalAmount { get; set; }
    // Phan tram giam da ap dung (0 neu khong co uu dai).
    public int DiscountPercent { get; set; }
    public string Currency { get; set; } = "VND";
    public string Provider { get; set; } = string.Empty;
    public string PaymentReference { get; set; } = string.Empty;
    public string QrCodeUrl { get; set; } = string.Empty;
    public string BankAccountNo { get; set; } = string.Empty;
    public string BankCode { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public Guid? SubscriptionId { get; set; }
}

public class AdminChatSubscriptionItemResponse
{
    public Guid SubscriptionId { get; set; }
    public string ScopeType { get; set; } = string.Empty;
    public Guid? OwnerUserId { get; set; }
    public string? OwnerEmail { get; set; }
    public Guid? PetId { get; set; }
    public string? PetName { get; set; }
    public Guid? ClinicId { get; set; }
    public string? ClinicName { get; set; }
    public string PlanCode { get; set; } = string.Empty;
    public string PlanName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime StartsAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AdminChatSubscriptionPaymentItemResponse
{
    public Guid PaymentId { get; set; }
    public Guid OwnerUserId { get; set; }
    public string OwnerEmail { get; set; } = string.Empty;
    public Guid PetId { get; set; }
    public string PetName { get; set; } = string.Empty;
    public string PlanCode { get; set; } = string.Empty;
    public string PlanName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Currency { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
    public string PaymentReference { get; set; } = string.Empty;
    public string? ProviderTransactionId { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AdminChatSubscriptionsResponse
{
    public List<ChatSubscriptionPlanResponse> Plans { get; set; } = new();
    public List<AdminChatSubscriptionItemResponse> Subscriptions { get; set; } = new();
    public List<AdminChatSubscriptionPaymentItemResponse> Payments { get; set; } = new();
}
