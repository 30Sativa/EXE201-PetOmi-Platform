using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Exceptions;

namespace PetOmiPlatform.Domain.Entities;

public class ChatSubscriptionDomain : BaseEntity
{
    public ChatSubscriptionScopeType ScopeType { get; private set; }
    public Guid? OwnerUserId { get; private set; }
    public Guid? PetId { get; private set; }
    public Guid? ClinicId { get; private set; }
    public Guid PlanId { get; private set; }
    public ChatSubscriptionStatus Status { get; private set; }
    public DateTime StartsAt { get; private set; }
    public DateTime ExpiresAt { get; private set; }
    public DateTime? CancelledAt { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    private ChatSubscriptionDomain() { }

    public static ChatSubscriptionDomain CreateOwnerPet(
        Guid ownerUserId,
        Guid petId,
        Guid planId,
        DateTime startsAtUtc,
        int billingCycleDays)
    {
        if (ownerUserId == Guid.Empty)
            throw new DomainException("Owner khong hop le.");
        if (petId == Guid.Empty)
            throw new DomainException("Thu cung khong hop le.");
        if (planId == Guid.Empty)
            throw new DomainException("Goi chat khong hop le.");
        if (billingCycleDays <= 0)
            throw new DomainException("Chu ky goi chat khong hop le.");

        return new ChatSubscriptionDomain
        {
            Id = Guid.NewGuid(),
            ScopeType = ChatSubscriptionScopeType.OwnerPet,
            OwnerUserId = ownerUserId,
            PetId = petId,
            ClinicId = null,
            PlanId = planId,
            Status = ChatSubscriptionStatus.Active,
            StartsAt = startsAtUtc,
            ExpiresAt = startsAtUtc.AddDays(billingCycleDays),
            CancelledAt = null,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
    }

    public static ChatSubscriptionDomain Reconstitute(
        Guid id,
        ChatSubscriptionScopeType scopeType,
        Guid? ownerUserId,
        Guid? petId,
        Guid? clinicId,
        Guid planId,
        ChatSubscriptionStatus status,
        DateTime startsAt,
        DateTime expiresAt,
        DateTime? cancelledAt,
        bool isActive,
        DateTime createdAt,
        DateTime? updatedAt)
    {
        return new ChatSubscriptionDomain
        {
            Id = id,
            ScopeType = scopeType,
            OwnerUserId = ownerUserId,
            PetId = petId,
            ClinicId = clinicId,
            PlanId = planId,
            Status = status,
            StartsAt = startsAt,
            ExpiresAt = expiresAt,
            CancelledAt = cancelledAt,
            IsActive = isActive,
            CreatedAt = createdAt,
            UpdatedAt = updatedAt
        };
    }

    public bool IsUsableAt(DateTime utcNow)
    {
        return IsActive && Status == ChatSubscriptionStatus.Active && ExpiresAt > utcNow;
    }

    public void Renew(Guid planId, DateTime utcNow, int billingCycleDays)
    {
        if (billingCycleDays <= 0)
            throw new DomainException("Chu ky goi chat khong hop le.");

        var renewalStart = IsUsableAt(utcNow) ? ExpiresAt : utcNow;

        PlanId = planId;
        Status = ChatSubscriptionStatus.Active;
        StartsAt = IsUsableAt(utcNow) ? StartsAt : utcNow;
        ExpiresAt = renewalStart.AddDays(billingCycleDays);
        CancelledAt = null;
        IsActive = true;
        UpdatedAt = utcNow;
    }

    public void MarkExpired(DateTime utcNow)
    {
        if (Status != ChatSubscriptionStatus.Active || ExpiresAt > utcNow)
            return;

        Status = ChatSubscriptionStatus.Expired;
        IsActive = false;
        UpdatedAt = utcNow;
    }

    public void Cancel(DateTime utcNow)
    {
        if (Status == ChatSubscriptionStatus.Cancelled)
            return;

        Status = ChatSubscriptionStatus.Cancelled;
        IsActive = false;
        CancelledAt = utcNow;
        UpdatedAt = utcNow;
    }
}
