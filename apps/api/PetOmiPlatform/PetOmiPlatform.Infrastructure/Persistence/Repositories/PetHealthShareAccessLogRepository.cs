using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Infrastructure.Mappers;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories
{
    public class PetHealthShareAccessLogRepository : IPetHealthShareAccessLogRepository
    {
        private readonly PetOmniDbContext _context;

        public PetHealthShareAccessLogRepository(PetOmniDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(PetHealthShareAccessLogDomain accessLog)
        {
            await _context.PetHealthShareAccessLogs.AddAsync(accessLog.ToEntity());
        }

        public async Task<List<PetHealthShareAccessLogDomain>> GetByPetIdAsync(Guid petId, int limit)
        {
            var take = Math.Clamp(limit, 1, 100);
            var entities = await _context.PetHealthShareAccessLogs
                .Where(l => l.PetId == petId)
                .OrderByDescending(l => l.CreatedAt)
                .Take(take)
                .ToListAsync();

            return entities.Select(e => e.ToDomain()).ToList();
        }

        public async Task<List<PetHealthShareAccessLogDomain>> GetByShareTokenIdAsync(Guid shareTokenId, int limit)
        {
            var take = Math.Clamp(limit, 1, 100);
            var entities = await _context.PetHealthShareAccessLogs
                .Where(l => l.ShareTokenId == shareTokenId)
                .OrderByDescending(l => l.CreatedAt)
                .Take(take)
                .ToListAsync();

            return entities.Select(e => e.ToDomain()).ToList();
        }
    }
}
