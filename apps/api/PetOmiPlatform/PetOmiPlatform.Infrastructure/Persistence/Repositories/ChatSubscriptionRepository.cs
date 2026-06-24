using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Infrastructure.Mappers;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories;

public class ChatSubscriptionRepository : IChatSubscriptionRepository
{
    private readonly PetOmniDbContext _context;

    public ChatSubscriptionRepository(PetOmniDbContext context)
    {
        _context = context;
    }

    public async Task<List<ChatSubscriptionPlanDomain>> GetActivePlansAsync()
    {
        var entities = await _context.ChatSubscriptionPlans
            .AsNoTracking()
            .Where(p => p.IsActive)
            .OrderBy(p => p.SortOrder)
            .ThenBy(p => p.PriceMonthly)
            .ToListAsync();

        return entities.Select(e => e.ToDomain()).ToList();
    }

    public async Task<ChatSubscriptionPlanDomain?> GetPlanByCodeAsync(string code)
    {
        if (string.IsNullOrWhiteSpace(code))
            return null;

        var normalized = code.Trim().ToLowerInvariant();
        var entity = await _context.ChatSubscriptionPlans
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Code == normalized && p.IsActive);

        return entity?.ToDomain();
    }

    public async Task<ChatSubscriptionPlanDomain?> GetPlanByIdAsync(Guid planId)
    {
        var entity = await _context.ChatSubscriptionPlans
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.PlanId == planId);

        return entity?.ToDomain();
    }

    public async Task<ChatSubscriptionDomain?> GetActiveOwnerPetSubscriptionAsync(
        Guid ownerUserId,
        Guid petId,
        DateTime utcNow)
    {
        var entity = await _context.ChatSubscriptions
            .Where(s =>
                s.ScopeType == ChatSubscriptionScopeType.OwnerPet.ToString() &&
                s.OwnerUserId == ownerUserId &&
                s.PetId == petId &&
                s.Status == ChatSubscriptionStatus.Active.ToString() &&
                s.IsActive &&
                s.ExpiresAt > utcNow)
            .OrderByDescending(s => s.ExpiresAt)
            .FirstOrDefaultAsync();

        return entity?.ToDomain();
    }

    public async Task<ChatSubscriptionDomain?> GetLatestOwnerPetSubscriptionAsync(Guid ownerUserId, Guid petId)
    {
        var entity = await _context.ChatSubscriptions
            .Where(s =>
                s.ScopeType == ChatSubscriptionScopeType.OwnerPet.ToString() &&
                s.OwnerUserId == ownerUserId &&
                s.PetId == petId)
            .OrderByDescending(s => s.ExpiresAt)
            .FirstOrDefaultAsync();

        return entity?.ToDomain();
    }

    public async Task<ChatSubscriptionDomain?> GetActiveOwnerSubscriptionAsync(Guid ownerUserId, DateTime utcNow)
    {
        // Gop chung theo user: chi can co 1 subscription Premium dang active la dung cho moi pet.
        var entity = await _context.ChatSubscriptions
            .Where(s =>
                s.ScopeType == ChatSubscriptionScopeType.OwnerPet.ToString() &&
                s.OwnerUserId == ownerUserId &&
                s.Status == ChatSubscriptionStatus.Active.ToString() &&
                s.IsActive &&
                s.ExpiresAt > utcNow)
            .OrderByDescending(s => s.ExpiresAt)
            .FirstOrDefaultAsync();

        return entity?.ToDomain();
    }

    public async Task<ChatSubscriptionDomain?> GetLatestOwnerSubscriptionAsync(Guid ownerUserId)
    {
        // Gop chung theo user: lay subscription moi nhat (bat ky pet nao) de renew.
        var entity = await _context.ChatSubscriptions
            .Where(s =>
                s.ScopeType == ChatSubscriptionScopeType.OwnerPet.ToString() &&
                s.OwnerUserId == ownerUserId)
            .OrderByDescending(s => s.ExpiresAt)
            .FirstOrDefaultAsync();

        return entity?.ToDomain();
    }

    public async Task<List<OwnerChatSubscriptionItem>> GetOwnerPetSubscriptionsAsync(Guid ownerUserId, DateTime utcNow)
    {
        return await _context.ChatSubscriptions
            .AsNoTracking()
            .Where(s =>
                s.ScopeType == ChatSubscriptionScopeType.OwnerPet.ToString() &&
                s.OwnerUserId == ownerUserId)
            .OrderByDescending(s => s.ExpiresAt)
            .Select(s => new OwnerChatSubscriptionItem
            {
                SubscriptionId = s.SubscriptionId,
                OwnerUserId = s.OwnerUserId ?? Guid.Empty,
                PetId = s.PetId ?? Guid.Empty,
                PetName = s.Pet != null ? s.Pet.Name : string.Empty,
                PlanId = s.PlanId,
                PlanCode = s.Plan.Code,
                PlanName = s.Plan.Name,
                Status = s.Status,
                StartsAt = s.StartsAt,
                ExpiresAt = s.ExpiresAt,
                IsUsable = s.IsActive &&
                    s.Status == ChatSubscriptionStatus.Active.ToString() &&
                    s.ExpiresAt > utcNow
            })
            .ToListAsync();
    }

    public async Task<ChatSubscriptionPaymentDomain?> GetPaymentByIdAsync(Guid paymentId)
    {
        var entity = await _context.ChatSubscriptionPayments
            .FirstOrDefaultAsync(p => p.PaymentId == paymentId);

        return entity?.ToDomain();
    }

    public async Task<ChatSubscriptionPaymentDomain?> GetPaymentByReferenceAsync(string paymentReference)
    {
        if (string.IsNullOrWhiteSpace(paymentReference))
            return null;

        var normalized = paymentReference.Trim().ToUpperInvariant();
        var entity = await _context.ChatSubscriptionPayments
            .FirstOrDefaultAsync(p => p.PaymentReference == normalized);

        return entity?.ToDomain();
    }

    public async Task<bool> AnyPaymentReferenceAsync(string paymentReference)
    {
        if (string.IsNullOrWhiteSpace(paymentReference))
            return false;

        var normalized = paymentReference.Trim().ToUpperInvariant();
        return await _context.ChatSubscriptionPayments
            .AsNoTracking()
            .AnyAsync(p => p.PaymentReference == normalized);
    }

    public async Task<bool> AnyProviderTransactionAsync(PaymentProvider provider, string providerTransactionId)
    {
        if (string.IsNullOrWhiteSpace(providerTransactionId))
            return false;

        var providerText = provider.ToString();
        var normalized = providerTransactionId.Trim();
        return await _context.ChatSubscriptionPayments
            .AsNoTracking()
            .AnyAsync(p => p.Provider == providerText && p.ProviderTransactionId == normalized);
    }

    public async Task<ChatUsageStats> GetUserMessageUsageAsync(
        Guid ownerUserId,
        Guid? petId,
        DateTime fromUtc,
        DateTime toUtc)
    {
        var query = _context.ChatMessages
            .AsNoTracking()
            .Where(m =>
                m.IsActive &&
                m.CreatedAt >= fromUtc &&
                m.CreatedAt < toUtc &&
                m.Conversation != null &&
                m.Conversation.UserId == ownerUserId);

        if (petId.HasValue)
        {
            query = query.Where(m => m.Conversation!.PetId == petId.Value);
        }

        var userMessages = await query.CountAsync(m => m.SenderRole == "user" || m.SenderRole == "User");
        var aiResponses = await query.CountAsync(m => m.SenderRole == "assistant" || m.SenderRole == "AI");
        var totalTokens = await query.SumAsync(m => m.TokensInput + m.TokensOutput);

        return new ChatUsageStats
        {
            UserMessages = userMessages,
            AiResponses = aiResponses,
            TotalTokens = totalTokens
        };
    }

    public async Task<List<Guid>> GetUserIdsWithMessagesInRangeAsync(DateTime fromUtc, DateTime toUtc)
    {
        return await _context.ChatMessages
            .AsNoTracking()
            .Where(m =>
                m.IsActive &&
                m.CreatedAt >= fromUtc &&
                m.CreatedAt < toUtc &&
                m.Conversation != null &&
                (m.SenderRole == "user" || m.SenderRole == "User"))
            .Select(m => m.Conversation!.UserId)
            .Distinct()
            .ToListAsync();
    }

    public async Task<bool> HasAnyTrialAsync(Guid ownerUserId)
    {
        return await _context.ChatSubscriptions
            .AsNoTracking()
            .AnyAsync(s => s.OwnerUserId == ownerUserId && s.IsTrial);
    }

    public async Task<int> CountPaidPaymentsAsync(Guid ownerUserId)
    {
        return await _context.ChatSubscriptionPayments
            .AsNoTracking()
            .CountAsync(p => p.OwnerUserId == ownerUserId && p.Status == "Paid");
    }

    public async Task<List<AdminChatSubscriptionItem>> GetAdminSubscriptionsAsync(int take)
    {
        take = Math.Clamp(take, 1, 200);

        return await _context.ChatSubscriptions
            .AsNoTracking()
            .OrderByDescending(s => s.CreatedAt)
            .Take(take)
            .Select(s => new AdminChatSubscriptionItem
            {
                SubscriptionId = s.SubscriptionId,
                ScopeType = s.ScopeType,
                OwnerUserId = s.OwnerUserId,
                OwnerEmail = s.OwnerUser != null ? s.OwnerUser.Email : null,
                PetId = s.PetId,
                PetName = s.Pet != null ? s.Pet.Name : null,
                ClinicId = s.ClinicId,
                ClinicName = s.Clinic != null ? s.Clinic.ClinicName : null,
                PlanCode = s.Plan.Code,
                PlanName = s.Plan.Name,
                Status = s.Status,
                StartsAt = s.StartsAt,
                ExpiresAt = s.ExpiresAt,
                IsActive = s.IsActive,
                CreatedAt = s.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<List<AdminChatSubscriptionPaymentItem>> GetAdminPaymentsAsync(int take)
    {
        take = Math.Clamp(take, 1, 200);

        return await _context.ChatSubscriptionPayments
            .AsNoTracking()
            .OrderByDescending(p => p.CreatedAt)
            .Take(take)
            .Select(p => new AdminChatSubscriptionPaymentItem
            {
                PaymentId = p.PaymentId,
                OwnerUserId = p.OwnerUserId,
                OwnerEmail = p.OwnerUser.Email,
                PetId = p.PetId,
                PetName = p.Pet.Name,
                PlanCode = p.Plan.Code,
                PlanName = p.Plan.Name,
                Status = p.Status,
                Amount = p.Amount,
                Currency = p.Currency,
                Provider = p.Provider,
                PaymentReference = p.PaymentReference,
                ProviderTransactionId = p.ProviderTransactionId,
                PaidAt = p.PaidAt,
                ExpiresAt = p.ExpiresAt,
                CreatedAt = p.CreatedAt
            })
            .ToListAsync();
    }
    public async Task AddSubscriptionAsync(ChatSubscriptionDomain subscription)
    {
        await _context.ChatSubscriptions.AddAsync(subscription.ToEntity());
    }

    public async Task UpdateSubscriptionAsync(ChatSubscriptionDomain subscription)
    {
        var entity = await _context.ChatSubscriptions.FindAsync(subscription.Id);
        if (entity == null)
            return;

        var updated = subscription.ToEntity();
        _context.Entry(entity).CurrentValues.SetValues(updated);
    }

    public async Task AddPaymentAsync(ChatSubscriptionPaymentDomain payment)
    {
        await _context.ChatSubscriptionPayments.AddAsync(payment.ToEntity());
    }

    public async Task UpdatePaymentAsync(ChatSubscriptionPaymentDomain payment)
    {
        var entity = await _context.ChatSubscriptionPayments.FindAsync(payment.Id);
        if (entity == null)
            return;

        var updated = payment.ToEntity();
        _context.Entry(entity).CurrentValues.SetValues(updated);
    }
}
