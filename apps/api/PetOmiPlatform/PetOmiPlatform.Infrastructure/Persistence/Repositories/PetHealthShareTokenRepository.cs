using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Infrastructure.Mappers;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories
{
    public class PetHealthShareTokenRepository : IPetHealthShareTokenRepository
    {
        private readonly PetOmniDbContext _context;

        public PetHealthShareTokenRepository(PetOmniDbContext context)
        {
            _context = context;
        }

        public async Task<PetHealthShareTokenDomain?> GetByIdAsync(Guid shareTokenId)
        {
            var entity = await _context.PetHealthShareTokens
                .FirstOrDefaultAsync(t => t.ShareTokenId == shareTokenId);
            return entity?.ToDomain();
        }

        public async Task<PetHealthShareTokenDomain?> GetByDisplayCodeAsync(string displayCode)
        {
            var normalizedCode = displayCode.Trim().ToUpper();
            var entity = await _context.PetHealthShareTokens
                .FirstOrDefaultAsync(t => t.DisplayCode == normalizedCode && t.RevokedAt == null);
            return entity?.ToDomain();
        }

        public async Task<PetHealthShareTokenDomain?> GetByTokenHashAsync(string tokenHash)
        {
            var entity = await _context.PetHealthShareTokens
                .FirstOrDefaultAsync(t => t.TokenHash == tokenHash && t.RevokedAt == null);
            return entity?.ToDomain();
        }

        public async Task<List<PetHealthShareTokenDomain>> GetByPetIdAsync(Guid petId)
        {
            var entities = await _context.PetHealthShareTokens
                .Where(t => t.PetId == petId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            return entities.Select(e => e.ToDomain()).ToList();
        }

        public async Task<bool> DisplayCodeExistsAsync(string displayCode)
        {
            var normalizedCode = displayCode.Trim().ToUpper();
            return await _context.PetHealthShareTokens
                .AnyAsync(t => t.DisplayCode == normalizedCode && t.RevokedAt == null);
        }

        public async Task AddAsync(PetHealthShareTokenDomain token)
        {
            await _context.PetHealthShareTokens.AddAsync(token.ToEntity());
        }

        public async Task UpdateAsync(PetHealthShareTokenDomain token)
        {
            var entity = await _context.PetHealthShareTokens.FindAsync(token.Id);
            if (entity == null) return;

            var updated = token.ToEntity();
            _context.Entry(entity).CurrentValues.SetValues(updated);
        }
    }
}
