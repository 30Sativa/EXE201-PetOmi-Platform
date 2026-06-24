using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;

namespace PetOmiPlatform.Domain.Interfaces.Repositories;

public interface IChatSubscriptionRepository
{
    Task<List<ChatSubscriptionPlanDomain>> GetActivePlansAsync();
    Task<ChatSubscriptionPlanDomain?> GetPlanByCodeAsync(string code);
    Task<ChatSubscriptionPlanDomain?> GetPlanByIdAsync(Guid planId);
    Task<ChatSubscriptionDomain?> GetActiveOwnerPetSubscriptionAsync(Guid ownerUserId, Guid petId, DateTime utcNow);
    Task<ChatSubscriptionDomain?> GetLatestOwnerPetSubscriptionAsync(Guid ownerUserId, Guid petId);
    // Gop chung theo user: lay subscription dang active cua user (bat ky pet nao).
    Task<ChatSubscriptionDomain?> GetActiveOwnerSubscriptionAsync(Guid ownerUserId, DateTime utcNow);
    // Gop chung theo user: lay subscription moi nhat cua user (de renew).
    Task<ChatSubscriptionDomain?> GetLatestOwnerSubscriptionAsync(Guid ownerUserId);
    Task<List<OwnerChatSubscriptionItem>> GetOwnerPetSubscriptionsAsync(Guid ownerUserId, DateTime utcNow);
    Task<ChatSubscriptionPaymentDomain?> GetPaymentByIdAsync(Guid paymentId);
    Task<ChatSubscriptionPaymentDomain?> GetPaymentByReferenceAsync(string paymentReference);
    Task<bool> AnyPaymentReferenceAsync(string paymentReference);
    Task<bool> AnyProviderTransactionAsync(PaymentProvider provider, string providerTransactionId);
    Task<ChatUsageStats> GetUserMessageUsageAsync(Guid ownerUserId, Guid? petId, DateTime fromUtc, DateTime toUtc);
    // Lay danh sach UserID da chat trong khoang thoi gian (ung vien xet "bo do nang cap").
    Task<List<Guid>> GetUserIdsWithMessagesInRangeAsync(DateTime fromUtc, DateTime toUtc);
    // User da tung dung free trial chua (moi user chi duoc 1 lan).
    Task<bool> HasAnyTrialAsync(Guid ownerUserId);
    // So lan thanh toan thanh cong (Paid) cua user - dung de xet dieu kien Early-bird.
    Task<int> CountPaidPaymentsAsync(Guid ownerUserId);
    Task<List<AdminChatSubscriptionItem>> GetAdminSubscriptionsAsync(int take);
    Task<List<AdminChatSubscriptionPaymentItem>> GetAdminPaymentsAsync(int take);
    Task AddSubscriptionAsync(ChatSubscriptionDomain subscription);
    Task UpdateSubscriptionAsync(ChatSubscriptionDomain subscription);
    Task AddPaymentAsync(ChatSubscriptionPaymentDomain payment);
    Task UpdatePaymentAsync(ChatSubscriptionPaymentDomain payment);
}

public class ChatUsageStats
{
    public int UserMessages { get; set; }
    public int AiResponses { get; set; }
    public int TotalTokens { get; set; }
}

public class OwnerChatSubscriptionItem
{
    public Guid SubscriptionId { get; set; }
    public Guid OwnerUserId { get; set; }
    public Guid PetId { get; set; }
    public string PetName { get; set; } = string.Empty;
    public Guid PlanId { get; set; }
    public string PlanCode { get; set; } = string.Empty;
    public string PlanName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime StartsAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsUsable { get; set; }
}

public class AdminChatSubscriptionItem
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

public class AdminChatSubscriptionPaymentItem
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
