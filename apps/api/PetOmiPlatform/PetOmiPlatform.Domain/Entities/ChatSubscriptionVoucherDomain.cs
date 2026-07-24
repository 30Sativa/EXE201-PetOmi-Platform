using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Exceptions;

namespace PetOmiPlatform.Domain.Entities;

public class ChatSubscriptionVoucherDomain : BaseEntity
{
    public string Code { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public ChatSubscriptionVoucherDiscountType DiscountType { get; private set; }
    public decimal DiscountValue { get; private set; }
    public decimal? MaxDiscountAmount { get; private set; }
    public decimal MinOrderAmount { get; private set; }
    public int? UsageLimit { get; private set; }
    public int UsedCount { get; private set; }
    public DateTime? StartsAt { get; private set; }
    public DateTime? ExpiresAt { get; private set; }
    public bool IsActive { get; private set; }
    public Guid? CreatedByAdminId { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    private ChatSubscriptionVoucherDomain() { }

    public static ChatSubscriptionVoucherDomain Create(
        string code,
        string name,
        string? description,
        ChatSubscriptionVoucherDiscountType discountType,
        decimal discountValue,
        decimal? maxDiscountAmount,
        decimal minOrderAmount,
        int? usageLimit,
        DateTime? startsAt,
        DateTime? expiresAt,
        bool isActive,
        Guid createdByAdminId)
    {
        if (createdByAdminId == Guid.Empty)
            throw new DomainException("Admin tao voucher khong hop le.");

        var voucher = new ChatSubscriptionVoucherDomain
        {
            Id = Guid.NewGuid(),
            CreatedByAdminId = createdByAdminId,
            CreatedAt = DateTime.UtcNow
        };

        voucher.ApplyInfo(
            code,
            name,
            description,
            discountType,
            discountValue,
            maxDiscountAmount,
            minOrderAmount,
            usageLimit,
            startsAt,
            expiresAt,
            isActive,
            DateTime.UtcNow);

        return voucher;
    }

    public static ChatSubscriptionVoucherDomain Reconstitute(
        Guid id,
        string code,
        string name,
        string? description,
        ChatSubscriptionVoucherDiscountType discountType,
        decimal discountValue,
        decimal? maxDiscountAmount,
        decimal minOrderAmount,
        int? usageLimit,
        int usedCount,
        DateTime? startsAt,
        DateTime? expiresAt,
        bool isActive,
        Guid? createdByAdminId,
        DateTime createdAt,
        DateTime? updatedAt)
    {
        return new ChatSubscriptionVoucherDomain
        {
            Id = id,
            Code = NormalizeCode(code),
            Name = name,
            Description = description,
            DiscountType = discountType,
            DiscountValue = discountValue,
            MaxDiscountAmount = maxDiscountAmount,
            MinOrderAmount = minOrderAmount,
            UsageLimit = usageLimit,
            UsedCount = usedCount,
            StartsAt = startsAt,
            ExpiresAt = expiresAt,
            IsActive = isActive,
            CreatedByAdminId = createdByAdminId,
            CreatedAt = createdAt,
            UpdatedAt = updatedAt
        };
    }

    public void Update(
        string code,
        string name,
        string? description,
        ChatSubscriptionVoucherDiscountType discountType,
        decimal discountValue,
        decimal? maxDiscountAmount,
        decimal minOrderAmount,
        int? usageLimit,
        DateTime? startsAt,
        DateTime? expiresAt,
        bool isActive,
        DateTime utcNow)
    {
        ApplyInfo(
            code,
            name,
            description,
            discountType,
            discountValue,
            maxDiscountAmount,
            minOrderAmount,
            usageLimit,
            startsAt,
            expiresAt,
            isActive,
            utcNow);
    }

    public void SetActive(bool isActive, DateTime utcNow)
    {
        IsActive = isActive;
        UpdatedAt = utcNow;
    }

    public void MarkUsed(DateTime utcNow)
    {
        UsedCount++;
        UpdatedAt = utcNow;
    }

    public bool CanApply(decimal orderAmount, DateTime utcNow)
    {
        return IsActive &&
            orderAmount >= MinOrderAmount &&
            (!StartsAt.HasValue || StartsAt.Value <= utcNow) &&
            (!ExpiresAt.HasValue || ExpiresAt.Value > utcNow) &&
            (!UsageLimit.HasValue || UsedCount < UsageLimit.Value);
    }

    public decimal CalculateDiscount(decimal orderAmount)
    {
        var discount = DiscountType == ChatSubscriptionVoucherDiscountType.Percent
            ? Math.Round(orderAmount * DiscountValue / 100m, 0)
            : DiscountValue;

        if (MaxDiscountAmount.HasValue && MaxDiscountAmount.Value > 0)
            discount = Math.Min(discount, MaxDiscountAmount.Value);

        return Math.Min(Math.Max(discount, 0), Math.Max(orderAmount - 1, 0));
    }

    private void ApplyInfo(
        string code,
        string name,
        string? description,
        ChatSubscriptionVoucherDiscountType discountType,
        decimal discountValue,
        decimal? maxDiscountAmount,
        decimal minOrderAmount,
        int? usageLimit,
        DateTime? startsAt,
        DateTime? expiresAt,
        bool isActive,
        DateTime utcNow)
    {
        var normalizedCode = NormalizeCode(code);
        if (string.IsNullOrWhiteSpace(normalizedCode))
            throw new DomainException("Ma voucher khong duoc de trong.");
        if (normalizedCode.Length > 40)
            throw new DomainException("Ma voucher toi da 40 ky tu.");
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Ten voucher khong duoc de trong.");
        if (discountValue <= 0)
            throw new DomainException("Gia tri giam phai lon hon 0.");
        if (discountType == ChatSubscriptionVoucherDiscountType.Percent && discountValue > 90)
            throw new DomainException("Voucher phan tram chi duoc giam toi da 90%.");
        if (maxDiscountAmount.HasValue && maxDiscountAmount.Value < 0)
            throw new DomainException("Muc giam toi da khong duoc am.");
        if (minOrderAmount < 0)
            throw new DomainException("Gia tri don toi thieu khong duoc am.");
        if (usageLimit.HasValue && usageLimit.Value <= 0)
            throw new DomainException("Gioi han luot dung phai lon hon 0.");
        if (usageLimit.HasValue && usageLimit.Value < UsedCount)
            throw new DomainException("Gioi han luot dung khong the thap hon luot da dung.");
        if (startsAt.HasValue && expiresAt.HasValue && expiresAt.Value <= startsAt.Value)
            throw new DomainException("Ngay het han voucher phai sau ngay bat dau.");
        if (startsAt.HasValue && startsAt.Value < utcNow && !HasSameInstant(StartsAt, startsAt))
            throw new DomainException("Ngay bat dau voucher khong duoc nam trong qua khu.");
        if (expiresAt.HasValue && expiresAt.Value < utcNow && !HasSameInstant(ExpiresAt, expiresAt))
            throw new DomainException("Ngay het han voucher khong duoc nam trong qua khu.");

        Code = normalizedCode;
        Name = name.Trim();
        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        DiscountType = discountType;
        DiscountValue = discountValue;
        MaxDiscountAmount = maxDiscountAmount;
        MinOrderAmount = minOrderAmount;
        UsageLimit = usageLimit;
        StartsAt = startsAt;
        ExpiresAt = expiresAt;
        IsActive = isActive;
        UpdatedAt = utcNow;
    }

    private static string NormalizeCode(string code)
    {
        return (code ?? string.Empty).Trim().Replace(" ", string.Empty).ToUpperInvariant();
    }

    private static bool HasSameInstant(DateTime? existingValue, DateTime? submittedValue)
    {
        return existingValue.HasValue && submittedValue.HasValue &&
            existingValue.Value.ToUniversalTime() == submittedValue.Value.ToUniversalTime();
    }
}
