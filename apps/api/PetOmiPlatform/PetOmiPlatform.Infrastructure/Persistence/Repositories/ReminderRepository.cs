using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Domain.Common.Enums;
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
    public class ReminderRepository : IReminderRepository
    {
        private readonly PetOmniDbContext _context;

        public ReminderRepository(PetOmniDbContext context)
        {
            _context = context;
        }

        public async Task<ReminderDomain?> GetByIdAsync(Guid reminderId)
        {
            var entity = await _context.Reminders
                .FirstOrDefaultAsync(r => r.ReminderId == reminderId);
            return entity?.ToDomain();
        }

        public async Task<List<ReminderDomain>> GetByUserIdAsync(Guid userId)
        {
            var entities = await _context.Reminders
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.RemindAt)
                .ToListAsync();
            return entities.Select(e => e.ToDomain()).ToList();
        }

        public async Task<List<ReminderDomain>> GetPendingRemindersAsync(DateTime now, int take = 100)
        {
            var pendingStatus = ReminderStatus.Pending.ToString();

            var entities = await _context.Reminders
                .Where(r => r.Status == pendingStatus && r.IsEnabled && r.RemindAt <= now && r.DismissedAt == null)
                .OrderBy(r => r.RemindAt)
                .Take(take)
                .ToListAsync();
            return entities.Select(e => e.ToDomain()).ToList();
        }

        public async Task<List<ReminderDomain>> GetByEntityAsync(Guid entityId, string entityType)
        {
            var entities = await _context.Reminders
                .Where(r => r.EntityId == entityId && r.EntityType == entityType)
                .OrderByDescending(r => r.RemindAt)
                .ToListAsync();
            return entities.Select(e => e.ToDomain()).ToList();
        }

        public async Task<List<ReminderDomain>> GetByPetIdAsync(Guid petId)
        {
            var entities = await _context.Reminders
                .Where(r => r.PetId == petId)
                .OrderByDescending(r => r.RemindAt)
                .ToListAsync();
            return entities.Select(e => e.ToDomain()).ToList();
        }

        public async Task<bool> ExistsByUserAndTypeSinceAsync(Guid userId, ReminderType reminderType, DateTime sinceUtc)
        {
            var typeStr = reminderType.ToString();
            return await _context.Reminders
                .AsNoTracking()
                .AnyAsync(r => r.UserId == userId
                    && r.ReminderType == typeStr
                    && r.CreatedAt >= sinceUtc);
        }

        public async Task AddAsync(ReminderDomain reminder)
        {
            await _context.Reminders.AddAsync(reminder.ToEntity());
        }

        public async Task AddRangeAsync(IEnumerable<ReminderDomain> reminders)
        {
            var entities = reminders.Select(r => r.ToEntity()).ToList();
            await _context.Reminders.AddRangeAsync(entities);
        }

        public async Task UpdateAsync(ReminderDomain reminder)
        {
            var entity = await _context.Reminders.FindAsync(reminder.Id);
            if (entity == null) return;

            var updated = reminder.ToEntity();
            _context.Entry(entity).CurrentValues.SetValues(updated);
        }
    }
}
