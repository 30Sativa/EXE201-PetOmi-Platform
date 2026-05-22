using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Infrastructure.Mappers;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories
{
    public class ReminderPreferenceRepository : IReminderPreferenceRepository
    {
        private readonly PetOmniDbContext _context;

        public ReminderPreferenceRepository(PetOmniDbContext context)
        {
            _context = context;
        }

        public async Task<ReminderPreferenceDomain?> GetByUserAndTypeAsync(Guid userId, string reminderType)
        {
            var entity = await _context.ReminderPreferences
                .FirstOrDefaultAsync(p => p.UserId == userId && p.ReminderType == reminderType);
            return entity?.ToDomain();
        }

        public async Task<List<ReminderPreferenceDomain>> GetByUserIdAsync(Guid userId)
        {
            var entities = await _context.ReminderPreferences
                .Where(p => p.UserId == userId)
                .ToListAsync();
            return entities.Select(e => e.ToDomain()).ToList();
        }

        public async Task AddAsync(ReminderPreferenceDomain preference)
        {
            await _context.ReminderPreferences.AddAsync(preference.ToEntity());
        }

        public async Task UpdateAsync(ReminderPreferenceDomain preference)
        {
            var entity = await _context.ReminderPreferences.FindAsync(preference.Id);
            if (entity == null) return;

            var updated = preference.ToEntity();
            _context.Entry(entity).CurrentValues.SetValues(updated);
        }
    }
}
