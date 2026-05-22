using PetOmiPlatform.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PetOmiPlatform.Domain.Interfaces.Repositories
{
    public interface IReminderPreferenceRepository
    {
        Task<ReminderPreferenceDomain?> GetByUserAndTypeAsync(Guid userId, string reminderType);
        Task<List<ReminderPreferenceDomain>> GetByUserIdAsync(Guid userId);
        Task AddAsync(ReminderPreferenceDomain preference);
        Task UpdateAsync(ReminderPreferenceDomain preference);
    }
}
