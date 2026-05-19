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
    public class PetWeightLogRepository : IPetWeightLogRepository
    {
        private readonly PetOmniDbContext _context;

        public PetWeightLogRepository(PetOmniDbContext context)
        {
            _context = context;
        }

        public async Task<PetWeightLogDomain?> GetByIdAsync(Guid weightLogId)
        {
            var entity = await _context.PetWeightLogs
                .FirstOrDefaultAsync(w => w.WeightLogId == weightLogId);
            return entity?.ToDomain();
        }

        public async Task<List<PetWeightLogDomain>> GetByPetIdAsync(Guid petId)
        {
            var entities = await _context.PetWeightLogs
                .Where(w => w.PetId == petId)
                .OrderByDescending(w => w.MeasuredAt)
                .ToListAsync();
            return entities.Select(e => e.ToDomain()).ToList();
        }

        public async Task AddAsync(PetWeightLogDomain weightLog)
        {
            await _context.PetWeightLogs.AddAsync(weightLog.ToEntity());
        }

        public async Task UpdateAsync(PetWeightLogDomain weightLog)
        {
            var entity = await _context.PetWeightLogs.FindAsync(weightLog.Id);
            if (entity == null) return;

            var updated = weightLog.ToEntity();
            _context.Entry(entity).CurrentValues.SetValues(updated);
        }

        public async Task DeleteAsync(Guid weightLogId)
        {
            var entity = await _context.PetWeightLogs.FindAsync(weightLogId);
            if (entity != null)
                _context.PetWeightLogs.Remove(entity);
        }
    }
}
