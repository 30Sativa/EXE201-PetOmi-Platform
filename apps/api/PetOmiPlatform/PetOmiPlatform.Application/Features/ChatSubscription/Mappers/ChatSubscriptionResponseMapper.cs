using PetOmiPlatform.Application.Features.ChatSubscription.DTOs;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.ChatSubscription.Mappers;

public static class ChatSubscriptionResponseMapper
{
    public static ChatSubscriptionPlanResponse ToResponse(this ChatSubscriptionPlanDomain plan)
    {
        return new ChatSubscriptionPlanResponse
        {
            PlanId = plan.Id,
            Code = plan.Code,
            Name = plan.Name,
            Description = plan.Description,
            PriceMonthly = plan.PriceMonthly,
            BillingCycleDays = plan.BillingCycleDays,
            MonthlyMessageQuota = plan.MonthlyMessageQuota,
            MonthlyTokenQuota = plan.MonthlyTokenQuota,
            PriorityLevel = plan.PriorityLevel,
            DeepRagEnabled = plan.DeepRagEnabled,
            ImageUploadEnabled = plan.ImageUploadEnabled,
            MaxImageUploadsPerMonth = plan.MaxImageUploadsPerMonth,
            IsActive = plan.IsActive,
            SortOrder = plan.SortOrder
        };
    }

    public static ChatSubscriptionUsageResponse ToUsageResponse(this ChatSubscriptionAccessResult access)
    {
        return new ChatSubscriptionUsageResponse
        {
            UsedMessages = access.UsedMessages,
            RemainingMessages = access.RemainingMessages,
            MonthlyMessageQuota = access.MonthlyMessageQuota,
            MonthlyTokenQuota = access.MonthlyTokenQuota,
            UsedTokens = access.UsedTokens,
            ResetAt = access.ResetAt
        };
    }

    public static ChatSubscriptionCapabilitiesResponse ToCapabilitiesResponse(this ChatSubscriptionAccessResult access)
    {
        return new ChatSubscriptionCapabilitiesResponse
        {
            PriorityLevel = access.PriorityLevel,
            DeepRagEnabled = access.DeepRagEnabled,
            ImageUploadEnabled = access.ImageUploadEnabled,
            MaxImageUploadsPerMonth = access.MaxImageUploadsPerMonth
        };
    }

    public static OwnerPetChatSubscriptionResponse ToResponse(this OwnerChatSubscriptionItem item)
    {
        return new OwnerPetChatSubscriptionResponse
        {
            SubscriptionId = item.SubscriptionId,
            PetId = item.PetId,
            PetName = item.PetName,
            PlanCode = item.PlanCode,
            PlanName = item.PlanName,
            Status = item.Status,
            StartsAt = item.StartsAt,
            ExpiresAt = item.ExpiresAt,
            IsUsable = item.IsUsable
        };
    }

    public static AdminChatSubscriptionItemResponse ToResponse(this AdminChatSubscriptionItem item)
    {
        return new AdminChatSubscriptionItemResponse
        {
            SubscriptionId = item.SubscriptionId,
            ScopeType = item.ScopeType,
            OwnerUserId = item.OwnerUserId,
            OwnerEmail = item.OwnerEmail,
            PetId = item.PetId,
            PetName = item.PetName,
            ClinicId = item.ClinicId,
            ClinicName = item.ClinicName,
            PlanCode = item.PlanCode,
            PlanName = item.PlanName,
            Status = item.Status,
            StartsAt = item.StartsAt,
            ExpiresAt = item.ExpiresAt,
            IsActive = item.IsActive,
            CreatedAt = item.CreatedAt
        };
    }

    public static AdminChatSubscriptionPaymentItemResponse ToResponse(this AdminChatSubscriptionPaymentItem item)
    {
        return new AdminChatSubscriptionPaymentItemResponse
        {
            PaymentId = item.PaymentId,
            OwnerUserId = item.OwnerUserId,
            OwnerEmail = item.OwnerEmail,
            PetId = item.PetId,
            PetName = item.PetName,
            PlanCode = item.PlanCode,
            PlanName = item.PlanName,
            Status = item.Status,
            Amount = item.Amount,
            Currency = item.Currency,
            Provider = item.Provider,
            PaymentReference = item.PaymentReference,
            ProviderTransactionId = item.ProviderTransactionId,
            PaidAt = item.PaidAt,
            ExpiresAt = item.ExpiresAt,
            CreatedAt = item.CreatedAt
        };
    }
}
