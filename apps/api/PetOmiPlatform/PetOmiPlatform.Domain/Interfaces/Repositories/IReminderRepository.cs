using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IReminderRepository
    {
        Task<ReminderDomain?> GetByIdAsync(Guid reminderId);
        Task<List<ReminderDomain>> GetByUserIdAsync(Guid userId);
        Task<List<ReminderDomain>> GetPendingRemindersAsync(DateTime now, int take = 100);
        Task<List<ReminderDomain>> GetByEntityAsync(Guid entityId, string entityType);
        Task<List<ReminderDomain>> GetByPetIdAsync(Guid petId);
        // Kiem tra da co reminder loai nay cho user ke tu moc thoi gian (chong gui trung trong chu ky).
        Task<bool> ExistsByUserAndTypeSinceAsync(Guid userId, ReminderType reminderType, DateTime sinceUtc);
        Task AddAsync(ReminderDomain reminder);
        Task AddRangeAsync(IEnumerable<ReminderDomain> reminders);
        Task UpdateAsync(ReminderDomain reminder);
    }
}
