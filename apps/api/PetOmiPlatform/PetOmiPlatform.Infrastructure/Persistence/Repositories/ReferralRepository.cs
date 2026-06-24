using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;
using PetOmiPlatform.Infrastructure.Persistence.Entities;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories;

public class ReferralRepository : IReferralRepository
{
    private readonly PetOmniDbContext _context;

    public ReferralRepository(PetOmniDbContext context)
    {
        _context = context;
    }

    public async Task<string> GetOrCreateReferralCodeAsync(Guid userId)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId)
            ?? throw new InvalidOperationException($"User {userId} not found.");

        if (!string.IsNullOrWhiteSpace(user.ReferralCode))
            return user.ReferralCode!;

        // Sinh ma duy nhat (8 ky tu HEX viet hoa), thu lai neu trung.
        for (var attempt = 0; attempt < 10; attempt++)
        {
            var code = GenerateCode();
            var exists = await _context.Users.AnyAsync(u => u.ReferralCode == code);
            if (exists) continue;

            user.ReferralCode = code;
            await _context.SaveChangesAsync();
            return code;
        }

        throw new InvalidOperationException("Khong the sinh ma gioi thieu duy nhat. Vui long thu lai.");
    }

    public async Task<Guid?> GetUserIdByReferralCodeAsync(string referralCode)
    {
        if (string.IsNullOrWhiteSpace(referralCode))
            return null;

        var normalized = referralCode.Trim().ToUpperInvariant();
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.ReferralCode == normalized);
        return user?.UserId;
    }

    public async Task<bool> HasRedemptionForNewUserAsync(Guid newUserId)
    {
        return await _context.ReferralRedemptions
            .AsNoTracking()
            .AnyAsync(r => r.NewUserId == newUserId);
    }

    public async Task AddRedemptionAsync(Guid referrerUserId, Guid newUserId, string referralCode, int bonusMessages)
    {
        await _context.ReferralRedemptions.AddAsync(new ReferralRedemption
        {
            RedemptionId = Guid.NewGuid(),
            ReferrerUserId = referrerUserId,
            NewUserId = newUserId,
            ReferralCode = referralCode.Trim().ToUpperInvariant(),
            BonusMessages = bonusMessages,
            CreatedAt = DateTime.UtcNow
        });
    }

    public async Task<int> GetTotalBonusMessagesAsync(Guid userId)
    {
        return await _context.ReferralRedemptions
            .AsNoTracking()
            .Where(r => r.ReferrerUserId == userId)
            .SumAsync(r => (int?)r.BonusMessages) ?? 0;
    }

    public async Task<int> GetSuccessfulReferralCountAsync(Guid userId)
    {
        return await _context.ReferralRedemptions
            .AsNoTracking()
            .CountAsync(r => r.ReferrerUserId == userId);
    }

    private static string GenerateCode()
    {
        return Guid.NewGuid().ToString("N").Substring(0, 8).ToUpperInvariant();
    }
}
