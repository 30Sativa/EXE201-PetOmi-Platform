using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Exceptions;

namespace PetOmiPlatform.Domain.Entities;

public class ChatSubscriptionPlanDomain : BaseEntity
{
    public string Code { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public decimal PriceMonthly { get; private set; }
    public int BillingCycleDays { get; private set; }
    public int MonthlyMessageQuota { get; private set; }
    public int? MonthlyTokenQuota { get; private set; }
    public int PriorityLevel { get; private set; }
    public bool DeepRagEnabled { get; private set; }
    public bool ImageUploadEnabled { get; private set; }
    public int MaxImageUploadsPerMonth { get; private set; }
    public bool IsActive { get; private set; }
    public int SortOrder { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    private ChatSubscriptionPlanDomain() { }

    public static ChatSubscriptionPlanDomain Create(
        string code,
        string name,
        string? description,
        decimal priceMonthly,
        int billingCycleDays,
        int monthlyMessageQuota,
        int? monthlyTokenQuota,
        int priorityLevel,
        bool deepRagEnabled,
        bool imageUploadEnabled,
        int maxImageUploadsPerMonth,
        int sortOrder)
    {
        Validate(code, name, priceMonthly, billingCycleDays, monthlyMessageQuota, maxImageUploadsPerMonth);

        return new ChatSubscriptionPlanDomain
        {
            Id = Guid.NewGuid(),
            Code = NormalizeCode(code),
            Name = name.Trim(),
            Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim(),
            PriceMonthly = priceMonthly,
            BillingCycleDays = billingCycleDays,
            MonthlyMessageQuota = monthlyMessageQuota,
            MonthlyTokenQuota = monthlyTokenQuota,
            PriorityLevel = priorityLevel,
            DeepRagEnabled = deepRagEnabled,
            ImageUploadEnabled = imageUploadEnabled,
            MaxImageUploadsPerMonth = maxImageUploadsPerMonth,
            IsActive = true,
            SortOrder = sortOrder,
            CreatedAt = DateTime.UtcNow
        };
    }

    public static ChatSubscriptionPlanDomain Reconstitute(
        Guid id,
        string code,
        string name,
        string? description,
        decimal priceMonthly,
        int billingCycleDays,
        int monthlyMessageQuota,
        int? monthlyTokenQuota,
        int priorityLevel,
        bool deepRagEnabled,
        bool imageUploadEnabled,
        int maxImageUploadsPerMonth,
        bool isActive,
        int sortOrder,
        DateTime createdAt,
        DateTime? updatedAt)
    {
        return new ChatSubscriptionPlanDomain
        {
            Id = id,
            Code = NormalizeCode(code),
            Name = name,
            Description = description,
            PriceMonthly = priceMonthly,
            BillingCycleDays = billingCycleDays,
            MonthlyMessageQuota = monthlyMessageQuota,
            MonthlyTokenQuota = monthlyTokenQuota,
            PriorityLevel = priorityLevel,
            DeepRagEnabled = deepRagEnabled,
            ImageUploadEnabled = imageUploadEnabled,
            MaxImageUploadsPerMonth = maxImageUploadsPerMonth,
            IsActive = isActive,
            SortOrder = sortOrder,
            CreatedAt = createdAt,
            UpdatedAt = updatedAt
        };
    }

    public bool IsFree => Code.Equals("free", StringComparison.OrdinalIgnoreCase);

    public bool IsPremium => Code.Equals("premium", StringComparison.OrdinalIgnoreCase);

    private static void Validate(
        string code,
        string name,
        decimal priceMonthly,
        int billingCycleDays,
        int monthlyMessageQuota,
        int maxImageUploadsPerMonth)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new DomainException("Ma goi chat khong hop le.");
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Ten goi chat khong hop le.");
        if (priceMonthly < 0)
            throw new DomainException("Gia goi chat khong duoc am.");
        if (billingCycleDays <= 0)
            throw new DomainException("Chu ky goi chat phai lon hon 0 ngay.");
        if (monthlyMessageQuota <= 0)
            throw new DomainException("Quota tin nhan phai lon hon 0.");
        if (maxImageUploadsPerMonth < 0)
            throw new DomainException("Quota upload anh khong duoc am.");
    }

    private static string NormalizeCode(string code)
    {
        return code.Trim().ToLowerInvariant();
    }
}
