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
        Task AddAsync(ReminderDomain reminder);
        Task AddRangeAsync(IEnumerable<ReminderDomain> reminders);
        Task UpdateAsync(ReminderDomain reminder);
    }
}
