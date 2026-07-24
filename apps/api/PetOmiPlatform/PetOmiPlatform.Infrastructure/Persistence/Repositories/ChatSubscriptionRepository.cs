using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Infrastructure.Mappers;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;
using PetOmiPlatform.Infrastructure.Persistence.Entities;

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
                PetId = s.PetId,
                PetName = s.Pet != null ? s.Pet.Name : null,
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

    public async Task<ChatSubscriptionPaymentDomain?> GetOpenPaymentByOwnerAsync(
        Guid ownerUserId,
        DateTime utcNow)
    {
        var entity = await _context.ChatSubscriptionPayments
            .AsNoTracking()
            .Where(p =>
                p.OwnerUserId == ownerUserId &&
                p.Status == ChatSubscriptionPaymentStatus.Pending.ToString() &&
                p.IsOpen &&
                p.ExpiresAt > utcNow)
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync();

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

    public async Task<bool> TryClaimPaymentAsync(Guid paymentId, DateTime utcNow)
    {
        var affectedRows = await _context.Database.ExecuteSqlInterpolatedAsync($"""
            UPDATE dbo.ChatSubscriptionPayments
            SET IsOpen = 0,
                UpdatedAt = {utcNow}
            WHERE PaymentID = {paymentId}
              AND Status = {ChatSubscriptionPaymentStatus.Pending.ToString()}
              AND IsOpen = 1
              AND ExpiresAt > {utcNow};
            """);

        return affectedRows == 1;
    }

    public Task<int> ExpirePendingPaymentsForOwnerAsync(Guid ownerUserId, DateTime utcNow)
    {
        return ExpirePendingPaymentsAsync(
            _context.ChatSubscriptionPayments.Where(p => p.OwnerUserId == ownerUserId),
            utcNow);
    }

    public Task<int> ExpirePendingPaymentsAsync(DateTime utcNow)
    {
        return ExpirePendingPaymentsAsync(_context.ChatSubscriptionPayments, utcNow);
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
                PetName = p.Pet != null ? p.Pet.Name : null,
                PlanCode = p.Plan.Code,
                PlanName = p.Plan.Name,
                Status = p.Status,
                Amount = p.Amount,
                OriginalAmount = p.OriginalAmount > 0 ? p.OriginalAmount : p.Amount + p.DiscountAmount,
                DiscountAmount = p.DiscountAmount,
                VoucherCode = p.VoucherCode,
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

    public async Task<List<ChatSubscriptionVoucherDomain>> GetAdminVouchersAsync(int take)
    {
        take = Math.Clamp(take, 1, 200);

        var entities = await _context.ChatSubscriptionVouchers
            .AsNoTracking()
            .OrderByDescending(v => v.CreatedAt)
            .Take(take)
            .ToListAsync();

        return entities.Select(v => v.ToDomain()).ToList();
    }

    public async Task<ChatSubscriptionVoucherDomain?> GetVoucherByIdAsync(Guid voucherId)
    {
        var entity = await _context.ChatSubscriptionVouchers
            .FirstOrDefaultAsync(v => v.VoucherId == voucherId);

        return entity?.ToDomain();
    }

    public async Task<ChatSubscriptionVoucherDomain?> GetVoucherByCodeAsync(string code)
    {
        if (string.IsNullOrWhiteSpace(code))
            return null;

        var normalized = code.Trim().Replace(" ", string.Empty).ToUpperInvariant();
        var entity = await _context.ChatSubscriptionVouchers
            .FirstOrDefaultAsync(v => v.Code == normalized);

        return entity?.ToDomain();
    }

    public async Task<bool> AnyVoucherCodeAsync(string code, Guid? exceptVoucherId = null)
    {
        if (string.IsNullOrWhiteSpace(code))
            return false;

        var normalized = code.Trim().Replace(" ", string.Empty).ToUpperInvariant();
        return await _context.ChatSubscriptionVouchers
            .AsNoTracking()
            .AnyAsync(v => v.Code == normalized && (!exceptVoucherId.HasValue || v.VoucherId != exceptVoucherId.Value));
    }

    public async Task<bool> HasPaymentsForVoucherAsync(Guid voucherId)
    {
        return await _context.ChatSubscriptionPayments
            .AsNoTracking()
            .AnyAsync(payment => payment.VoucherId == voucherId);
    }

    public async Task<bool> TryReserveVoucherAsync(Guid voucherId, DateTime utcNow)
    {
        var affectedRows = await _context.Database.ExecuteSqlInterpolatedAsync($"""
            UPDATE dbo.ChatSubscriptionVouchers
            SET ReservedCount = ReservedCount + 1,
                UpdatedAt = {utcNow}
            WHERE VoucherID = {voucherId}
              AND IsActive = 1
              AND (StartsAt IS NULL OR StartsAt <= {utcNow})
              AND (ExpiresAt IS NULL OR ExpiresAt > {utcNow})
              AND (UsageLimit IS NULL OR UsedCount + ReservedCount < UsageLimit);
            """);

        return affectedRows == 1;
    }

    public async Task CompleteVoucherReservationAsync(
        Guid voucherId,
        bool hadReservation,
        DateTime utcNow)
    {
        await _context.Database.ExecuteSqlInterpolatedAsync($"""
            UPDATE dbo.ChatSubscriptionVouchers
            SET UsedCount = UsedCount + 1,
                ReservedCount = CASE
                    WHEN {hadReservation} = CAST(1 AS bit) AND ReservedCount > 0 THEN ReservedCount - 1
                    ELSE ReservedCount
                END,
                UpdatedAt = {utcNow}
            WHERE VoucherID = {voucherId};
            """);
    }

    public async Task ReleaseVoucherReservationAsync(Guid voucherId, DateTime utcNow)
    {
        await _context.Database.ExecuteSqlInterpolatedAsync($"""
            UPDATE dbo.ChatSubscriptionVouchers
            SET ReservedCount = CASE WHEN ReservedCount > 0 THEN ReservedCount - 1 ELSE 0 END,
                UpdatedAt = {utcNow}
            WHERE VoucherID = {voucherId};
            """);
    }

    public async Task AddSubscriptionAsync(ChatSubscriptionDomain subscription)
    {
        await _context.ChatSubscriptions.AddAsync(subscription.ToEntity());
    }

    public async Task<bool> TryAddTrialAsync(
        ChatSubscriptionDomain subscription,
        CancellationToken cancellationToken)
    {
        var entity = subscription.ToEntity();
        await _context.ChatSubscriptions.AddAsync(entity, cancellationToken);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException exception) when (IsUniqueConstraintViolation(exception))
        {
            _context.Entry(entity).State = EntityState.Detached;
            return false;
        }
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

    public async Task<bool> TryAddOpenPaymentAsync(
        ChatSubscriptionPaymentDomain payment,
        CancellationToken cancellationToken)
    {
        var entity = payment.ToEntity();
        await _context.ChatSubscriptionPayments.AddAsync(entity, cancellationToken);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException exception) when (IsUniqueConstraintViolation(exception))
        {
            _context.Entry(entity).State = EntityState.Detached;
            return false;
        }
    }

    public async Task UpdatePaymentAsync(ChatSubscriptionPaymentDomain payment)
    {
        var entity = await _context.ChatSubscriptionPayments.FindAsync(payment.Id);
        if (entity == null)
            return;

        var updated = payment.ToEntity();
        _context.Entry(entity).CurrentValues.SetValues(updated);
    }

    public async Task AddVoucherAsync(ChatSubscriptionVoucherDomain voucher)
    {
        await _context.ChatSubscriptionVouchers.AddAsync(voucher.ToEntity());
    }

    public async Task UpdateVoucherAsync(ChatSubscriptionVoucherDomain voucher)
    {
        var entity = await _context.ChatSubscriptionVouchers.FindAsync(voucher.Id);
        if (entity == null)
            return;

        var updated = voucher.ToEntity();
        _context.Entry(entity).CurrentValues.SetValues(updated);
    }

    public async Task DeleteVoucherAsync(Guid voucherId)
    {
        var entity = await _context.ChatSubscriptionVouchers.FindAsync(voucherId);
        if (entity != null)
            _context.ChatSubscriptionVouchers.Remove(entity);
    }

    private async Task<int> ExpirePendingPaymentsAsync(
        IQueryable<ChatSubscriptionPayment> query,
        DateTime utcNow)
    {
        var payments = await query
            .Where(p =>
                p.Status == ChatSubscriptionPaymentStatus.Pending.ToString() &&
                p.IsOpen &&
                p.ExpiresAt <= utcNow)
            .ToListAsync();

        if (payments.Count == 0)
            return 0;

        var reservationsByVoucher = payments
            .Where(p => p.HasVoucherReservation && p.VoucherId.HasValue)
            .GroupBy(p => p.VoucherId!.Value)
            .ToDictionary(group => group.Key, group => group.Count());

        foreach (var payment in payments)
        {
            payment.Status = ChatSubscriptionPaymentStatus.Expired.ToString();
            payment.IsOpen = false;
            payment.HasVoucherReservation = false;
            payment.UpdatedAt = utcNow;
        }

        foreach (var (voucherId, releaseCount) in reservationsByVoucher)
        {
            var voucher = await _context.ChatSubscriptionVouchers
                .FirstOrDefaultAsync(v => v.VoucherId == voucherId);
            if (voucher == null)
                continue;

            voucher.ReservedCount = Math.Max(0, voucher.ReservedCount - releaseCount);
            voucher.UpdatedAt = utcNow;
        }

        return payments.Count;
    }

    private static bool IsUniqueConstraintViolation(DbUpdateException exception)
    {
        return exception.InnerException is SqlException { Number: 2601 or 2627 };
    }
}
