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
    public class PetUserAccessRepository : IPetUserAccessRepository
    {
        private readonly PetOmniDbContext _context;

        public PetUserAccessRepository(PetOmniDbContext context)
        {
            _context = context;
        }

        public async Task<PetUserAccessDomain?> GetByIdAsync(Guid petUserAccessId)
        {
            var entity = await _context.PetUserAccesses
                .FirstOrDefaultAsync(a => a.PetUserAccessId == petUserAccessId && a.IsActive);
            return entity?.ToDomain();
        }

        public async Task<PetUserAccessDomain?> GetByPetAndUserAsync(Guid petId, Guid userId)
        {
            var entity = await _context.PetUserAccesses
                .FirstOrDefaultAsync(a => a.PetId == petId && a.UserId == userId && a.IsActive);
            return entity?.ToDomain();
        }

        public async Task<List<PetUserAccessDomain>> GetByPetIdAsync(Guid petId)
        {
            var entities = await _context.PetUserAccesses
                .Where(a => a.PetId == petId && a.IsActive)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();
            return entities.Select(e => e.ToDomain()).ToList();
        }

        public async Task<List<PetUserAccessDomain>> GetByUserIdAsync(Guid userId)
        {
            var entities = await _context.PetUserAccesses
                .Where(a => a.UserId == userId && a.IsActive)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();
            return entities.Select(e => e.ToDomain()).ToList();
        }

        public async Task AddAsync(PetUserAccessDomain access)
        {
            await _context.PetUserAccesses.AddAsync(access.ToEntity());
        }

        public async Task UpdateAsync(PetUserAccessDomain access)
        {
            var entity = await _context.PetUserAccesses.FindAsync(access.Id);
            if (entity == null) return;

            var updated = access.ToEntity();
            _context.Entry(entity).CurrentValues.SetValues(updated);
        }

        public async Task RevokeAsync(Guid petUserAccessId)
        {
            var entity = await _context.PetUserAccesses.FindAsync(petUserAccessId);
            if (entity != null)
            {
                entity.IsActive = false;
                entity.RevokedAt = DateTime.UtcNow;
                entity.UpdatedAt = DateTime.UtcNow;
            }
        }
    }
}
