using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Services;

public class ChatSubscriptionAccessService : IChatSubscriptionAccessService
{
    private const string FreePlanCode = "free";

    private readonly IChatSubscriptionRepository _subscriptionRepository;

    public ChatSubscriptionAccessService(IChatSubscriptionRepository subscriptionRepository)
    {
        _subscriptionRepository = subscriptionRepository;
    }

    public async Task<ChatSubscriptionAccessResult> GetAccessAsync(
        Guid ownerUserId,
        Guid? petId,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        // Gop chung theo user: chi can 1 subscription Premium dang active la dung cho TAT CA pet.
        // PetId con duoc giu trong tham so de tuong thich, nhung khong con anh huong toi quota/usage.
        var subscription = await _subscriptionRepository.GetActiveOwnerSubscriptionAsync(ownerUserId, now);

        if (subscription != null)
        {
            var premiumPlan = await _subscriptionRepository.GetPlanByIdAsync(subscription.PlanId)
                ?? throw new ConflictException("Goi chat cua subscription khong con ton tai.");

            var (cycleStart, resetAt) = ResolveRollingCycle(
                subscription.StartsAt,
                premiumPlan.BillingCycleDays,
                now,
                subscription.ExpiresAt);

            // Usage tinh chung tren toan user (khong loc theo pet).
            var premiumUsage = await _subscriptionRepository.GetUserMessageUsageAsync(
                ownerUserId,
                petId: null,
                cycleStart,
                resetAt);

            return BuildResult(
                planId: premiumPlan.Id,
                planCode: premiumPlan.Code,
                planName: premiumPlan.Name,
                isPremium: premiumPlan.IsPremium,
                monthlyMessageQuota: premiumPlan.MonthlyMessageQuota,
                monthlyTokenQuota: premiumPlan.MonthlyTokenQuota,
                usedMessages: premiumUsage.UserMessages,
                usedTokens: premiumUsage.TotalTokens,
                resetAt: resetAt,
                subscriptionId: subscription.Id,
                subscriptionExpiresAt: subscription.ExpiresAt,
                priorityLevel: premiumPlan.PriorityLevel,
                deepRagEnabled: premiumPlan.DeepRagEnabled,
                imageUploadEnabled: premiumPlan.ImageUploadEnabled,
                maxImageUploadsPerMonth: premiumPlan.MaxImageUploadsPerMonth);
        }

        var freePlan = await _subscriptionRepository.GetPlanByCodeAsync(FreePlanCode)
            ?? throw new ConflictException("Chua cau hinh goi Free cho PetOmi AI.");

        var freeCycleStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var freeResetAt = freeCycleStart.AddMonths(1);
        var freeUsage = await _subscriptionRepository.GetUserMessageUsageAsync(
            ownerUserId,
            petId: null,
            fromUtc: freeCycleStart,
            toUtc: freeResetAt);

        return BuildResult(
            planId: freePlan.Id,
            planCode: freePlan.Code,
            planName: freePlan.Name,
            isPremium: false,
            monthlyMessageQuota: freePlan.MonthlyMessageQuota,
            monthlyTokenQuota: freePlan.MonthlyTokenQuota,
            usedMessages: freeUsage.UserMessages,
            usedTokens: freeUsage.TotalTokens,
            resetAt: freeResetAt,
            subscriptionId: null,
            subscriptionExpiresAt: null,
            priorityLevel: freePlan.PriorityLevel,
            deepRagEnabled: freePlan.DeepRagEnabled,
            imageUploadEnabled: freePlan.ImageUploadEnabled,
            maxImageUploadsPerMonth: freePlan.MaxImageUploadsPerMonth);
    }

    private static ChatSubscriptionAccessResult BuildResult(
        Guid planId,
        string planCode,
        string planName,
        bool isPremium,
        int monthlyMessageQuota,
        int? monthlyTokenQuota,
        int usedMessages,
        int usedTokens,
        DateTime resetAt,
        Guid? subscriptionId,
        DateTime? subscriptionExpiresAt,
        int priorityLevel,
        bool deepRagEnabled,
        bool imageUploadEnabled,
        int maxImageUploadsPerMonth)
    {
        var remaining = Math.Max(0, monthlyMessageQuota - usedMessages);

        return new ChatSubscriptionAccessResult
        {
            SubscriptionId = subscriptionId,
            PlanId = planId,
            PlanCode = planCode,
            PlanName = planName,
            IsPremium = isPremium,
            MonthlyMessageQuota = monthlyMessageQuota,
            MonthlyTokenQuota = monthlyTokenQuota,
            UsedMessages = usedMessages,
            UsedTokens = usedTokens,
            RemainingMessages = remaining,
            ResetAt = resetAt,
            SubscriptionExpiresAt = subscriptionExpiresAt,
            PriorityLevel = priorityLevel,
            DeepRagEnabled = deepRagEnabled,
            ImageUploadEnabled = imageUploadEnabled,
            MaxImageUploadsPerMonth = maxImageUploadsPerMonth,
            BlockReason = remaining > 0
                ? null
                : isPremium
                    ? "Ban da dung het quota Premium trong chu ky hien tai."
                    : "Ban da dung het quota Free thang nay. Hay nang cap Premium de tiep tuc dung PetOmi AI."
        };
    }

    private static (DateTime CycleStart, DateTime ResetAt) ResolveRollingCycle(
        DateTime startsAt,
        int cycleDays,
        DateTime now,
        DateTime subscriptionExpiresAt)
    {
        if (cycleDays <= 0)
        {
            cycleDays = 30;
        }

        var cycleStart = startsAt;
        while (cycleStart.AddDays(cycleDays) <= now)
        {
            cycleStart = cycleStart.AddDays(cycleDays);
        }

        var resetAt = cycleStart.AddDays(cycleDays);
        if (resetAt > subscriptionExpiresAt)
        {
            resetAt = subscriptionExpiresAt;
        }

        return (cycleStart, resetAt);
    }
}
