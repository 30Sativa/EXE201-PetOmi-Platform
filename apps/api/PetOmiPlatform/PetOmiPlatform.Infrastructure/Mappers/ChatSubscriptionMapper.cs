using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;

namespace PetOmiPlatform.Infrastructure.Mappers;

public static class ChatSubscriptionMapper
{
    public static ChatSubscriptionPlanDomain ToDomain(this ChatSubscriptionPlan entity)
    {
        return ChatSubscriptionPlanDomain.Reconstitute(
            id: entity.PlanId,
            code: entity.Code,
            name: entity.Name,
            description: entity.Description,
            priceMonthly: entity.PriceMonthly,
            billingCycleDays: entity.BillingCycleDays,
            monthlyMessageQuota: entity.MonthlyMessageQuota,
            monthlyTokenQuota: entity.MonthlyTokenQuota,
            priorityLevel: entity.PriorityLevel,
            deepRagEnabled: entity.DeepRagEnabled,
            imageUploadEnabled: entity.ImageUploadEnabled,
            maxImageUploadsPerMonth: entity.MaxImageUploadsPerMonth,
            isActive: entity.IsActive,
            sortOrder: entity.SortOrder,
            createdAt: entity.CreatedAt,
            updatedAt: entity.UpdatedAt);
    }

    public static ChatSubscriptionPlan ToEntity(this ChatSubscriptionPlanDomain domain)
    {
        return new ChatSubscriptionPlan
        {
            PlanId = domain.Id,
            Code = domain.Code,
            Name = domain.Name,
            Description = domain.Description,
            PriceMonthly = domain.PriceMonthly,
            BillingCycleDays = domain.BillingCycleDays,
            MonthlyMessageQuota = domain.MonthlyMessageQuota,
            MonthlyTokenQuota = domain.MonthlyTokenQuota,
            PriorityLevel = domain.PriorityLevel,
            DeepRagEnabled = domain.DeepRagEnabled,
            ImageUploadEnabled = domain.ImageUploadEnabled,
            MaxImageUploadsPerMonth = domain.MaxImageUploadsPerMonth,
            IsActive = domain.IsActive,
            SortOrder = domain.SortOrder,
            CreatedAt = domain.CreatedAt,
            UpdatedAt = domain.UpdatedAt
        };
    }

    public static ChatSubscriptionDomain ToDomain(this ChatSubscription entity)
    {
        var scopeType = Enum.TryParse<ChatSubscriptionScopeType>(entity.ScopeType, true, out var parsedScopeType)
            ? parsedScopeType
            : ChatSubscriptionScopeType.OwnerPet;

        var status = Enum.TryParse<ChatSubscriptionStatus>(entity.Status, true, out var parsedStatus)
            ? parsedStatus
            : ChatSubscriptionStatus.Expired;

        return ChatSubscriptionDomain.Reconstitute(
            id: entity.SubscriptionId,
            scopeType: scopeType,
            ownerUserId: entity.OwnerUserId,
            petId: entity.PetId,
            clinicId: entity.ClinicId,
            planId: entity.PlanId,
            status: status,
            startsAt: entity.StartsAt,
            expiresAt: entity.ExpiresAt,
            cancelledAt: entity.CancelledAt,
            isActive: entity.IsActive,
            createdAt: entity.CreatedAt,
            updatedAt: entity.UpdatedAt,
            isTrial: entity.IsTrial);
    }

    public static ChatSubscription ToEntity(this ChatSubscriptionDomain domain)
    {
        return new ChatSubscription
        {
            SubscriptionId = domain.Id,
            ScopeType = domain.ScopeType.ToString(),
            OwnerUserId = domain.OwnerUserId,
            PetId = domain.PetId,
            ClinicId = domain.ClinicId,
            PlanId = domain.PlanId,
            Status = domain.Status.ToString(),
            StartsAt = domain.StartsAt,
            ExpiresAt = domain.ExpiresAt,
            CancelledAt = domain.CancelledAt,
            IsActive = domain.IsActive,
            IsTrial = domain.IsTrial,
            CreatedAt = domain.CreatedAt,
            UpdatedAt = domain.UpdatedAt
        };
    }

    public static ChatSubscriptionPaymentDomain ToDomain(this ChatSubscriptionPayment entity)
    {
        var status = Enum.TryParse<ChatSubscriptionPaymentStatus>(entity.Status, true, out var parsedStatus)
            ? parsedStatus
            : ChatSubscriptionPaymentStatus.Pending;

        var provider = Enum.TryParse<PaymentProvider>(entity.Provider, true, out var parsedProvider)
            ? parsedProvider
            : PaymentProvider.SePay;

        return ChatSubscriptionPaymentDomain.Reconstitute(
            id: entity.PaymentId,
            subscriptionId: entity.SubscriptionId,
            planId: entity.PlanId,
            ownerUserId: entity.OwnerUserId,
            petId: entity.PetId,
            status: status,
            originalAmount: entity.OriginalAmount > 0 ? entity.OriginalAmount : entity.Amount + entity.DiscountAmount,
            discountAmount: entity.DiscountAmount,
            voucherId: entity.VoucherId,
            voucherCode: entity.VoucherCode,
            amount: entity.Amount,
            currency: entity.Currency,
            provider: provider,
            paymentReference: entity.PaymentReference,
            providerTransactionId: entity.ProviderTransactionId,
            qrCodeUrl: entity.QrCodeUrl,
            bankAccountNo: entity.BankAccountNo,
            bankCode: entity.BankCode,
            paidAt: entity.PaidAt,
            expiresAt: entity.ExpiresAt,
            isOpen: entity.IsOpen,
            hasVoucherReservation: entity.HasVoucherReservation,
            rawPayload: entity.RawPayload,
            createdAt: entity.CreatedAt,
            updatedAt: entity.UpdatedAt);
    }

    public static ChatSubscriptionPayment ToEntity(this ChatSubscriptionPaymentDomain domain)
    {
        return new ChatSubscriptionPayment
        {
            PaymentId = domain.Id,
            SubscriptionId = domain.SubscriptionId,
            PlanId = domain.PlanId,
            OwnerUserId = domain.OwnerUserId,
            PetId = domain.PetId,
            Status = domain.Status.ToString(),
            OriginalAmount = domain.OriginalAmount,
            DiscountAmount = domain.DiscountAmount,
            VoucherId = domain.VoucherId,
            VoucherCode = domain.VoucherCode,
            Amount = domain.Amount,
            Currency = domain.Currency,
            Provider = domain.Provider.ToString(),
            PaymentReference = domain.PaymentReference,
            ProviderTransactionId = domain.ProviderTransactionId,
            QrCodeUrl = domain.QrCodeUrl,
            BankAccountNo = domain.BankAccountNo,
            BankCode = domain.BankCode,
            PaidAt = domain.PaidAt,
            ExpiresAt = domain.ExpiresAt,
            IsOpen = domain.IsOpen,
            HasVoucherReservation = domain.HasVoucherReservation,
            RawPayload = domain.RawPayload,
            CreatedAt = domain.CreatedAt,
            UpdatedAt = domain.UpdatedAt
        };
    }

    public static ChatSubscriptionVoucherDomain ToDomain(this ChatSubscriptionVoucher entity)
    {
        var discountType = Enum.TryParse<ChatSubscriptionVoucherDiscountType>(entity.DiscountType, true, out var parsedType)
            ? parsedType
            : ChatSubscriptionVoucherDiscountType.Percent;

        return ChatSubscriptionVoucherDomain.Reconstitute(
            id: entity.VoucherId,
            code: entity.Code,
            name: entity.Name,
            description: entity.Description,
            discountType: discountType,
            discountValue: entity.DiscountValue,
            maxDiscountAmount: entity.MaxDiscountAmount,
            minOrderAmount: entity.MinOrderAmount,
            usageLimit: entity.UsageLimit,
            usedCount: entity.UsedCount,
            startsAt: entity.StartsAt,
            expiresAt: entity.ExpiresAt,
            isActive: entity.IsActive,
            createdByAdminId: entity.CreatedByAdminId,
            createdAt: entity.CreatedAt,
            updatedAt: entity.UpdatedAt);
    }

    public static ChatSubscriptionVoucher ToEntity(this ChatSubscriptionVoucherDomain domain)
    {
        return new ChatSubscriptionVoucher
        {
            VoucherId = domain.Id,
            Code = domain.Code,
            Name = domain.Name,
            Description = domain.Description,
            DiscountType = domain.DiscountType.ToString(),
            DiscountValue = domain.DiscountValue,
            MaxDiscountAmount = domain.MaxDiscountAmount,
            MinOrderAmount = domain.MinOrderAmount,
            UsageLimit = domain.UsageLimit,
            UsedCount = domain.UsedCount,
            StartsAt = domain.StartsAt,
            ExpiresAt = domain.ExpiresAt,
            IsActive = domain.IsActive,
            CreatedByAdminId = domain.CreatedByAdminId,
            CreatedAt = domain.CreatedAt,
            UpdatedAt = domain.UpdatedAt
        };
    }
}
