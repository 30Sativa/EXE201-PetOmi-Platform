using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;
using PetOmiPlatform.Infrastructure.Persistence.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories
{
    public class SystemSettingRepository : ISystemSettingRepository
    {
        private readonly PetOmniDbContext _context;

        public SystemSettingRepository(PetOmniDbContext context)
        {
            _context = context;
        }

        public async Task<List<SystemSettingDomain>> GetAllAsync()
        {
            var entities = await _context.SystemSettings.ToListAsync();
            return entities.Select(e => SystemSettingDomain.Reconstitute(
                e.SettingId,
                e.SettingKey,
                e.SettingValue,
                e.Category,
                e.Description,
                e.CreatedAt,
                e.UpdatedAt
            )).ToList();
        }

        public async Task<List<SystemSettingDomain>> GetByCategoryAsync(string category)
        {
            var entities = await _context.SystemSettings
                .Where(s => s.Category == category)
                .ToListAsync();
            return entities.Select(e => SystemSettingDomain.Reconstitute(
                e.SettingId,
                e.SettingKey,
                e.SettingValue,
                e.Category,
                e.Description,
                e.CreatedAt,
                e.UpdatedAt
            )).ToList();
        }

        public async Task<SystemSettingDomain?> GetByKeyAsync(string key)
        {
            var entity = await _context.SystemSettings
                .FirstOrDefaultAsync(s => s.SettingKey == key);
            if (entity == null) return null;
            return SystemSettingDomain.Reconstitute(
                entity.SettingId,
                entity.SettingKey,
                entity.SettingValue,
                entity.Category,
                entity.Description,
                entity.CreatedAt,
                entity.UpdatedAt
            );
        }

        public async Task UpsertAsync(SystemSettingDomain setting)
        {
            var existing = await _context.SystemSettings
                .FirstOrDefaultAsync(s => s.SettingKey == setting.SettingKey);

            if (existing != null)
            {
                existing.SettingValue = setting.SettingValue;
                existing.UpdatedAt = DateTime.UtcNow;
                _context.SystemSettings.Update(existing);
            }
            else
            {
                var entity = new SystemSetting
                {
                    SettingId = Guid.NewGuid(),
                    SettingKey = setting.SettingKey,
                    SettingValue = setting.SettingValue,
                    Category = setting.Category,
                    Description = setting.Description,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                };
                await _context.SystemSettings.AddAsync(entity);
            }
        }
    }
}
