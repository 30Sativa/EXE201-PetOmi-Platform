using System;
using System.Threading.Tasks;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    /// <summary>
    /// Quan ly ma gioi thieu (ReferralCode tren Users) va luot quy doi (ReferralRedemptions).
    /// Tach rieng khoi UserDomain de giam rui ro regression.
    /// </summary>
    public interface IReferralRepository
    {
        // Lay ma gioi thieu cua user (sinh moi neu chua co), bao dam duy nhat.
        Task<string> GetOrCreateReferralCodeAsync(Guid userId);

        // Tim userId tu ma gioi thieu (null neu khong co).
        Task<Guid?> GetUserIdByReferralCodeAsync(string referralCode);

        // Da co luot quy doi cho newUser chua (chong trung)?
        Task<bool> HasRedemptionForNewUserAsync(Guid newUserId);

        // Ghi nhan 1 luot gioi thieu thanh cong (khong save - de UnitOfWork commit).
        Task AddRedemptionAsync(Guid referrerUserId, Guid newUserId, string referralCode, int bonusMessages);

        // Tong so luot nhan AI cong them tu referral cho user (tong BonusMessages).
        Task<int> GetTotalBonusMessagesAsync(Guid userId);

        // Dem so luot gioi thieu thanh cong cua user.
        Task<int> GetSuccessfulReferralCountAsync(Guid userId);
    }
}
