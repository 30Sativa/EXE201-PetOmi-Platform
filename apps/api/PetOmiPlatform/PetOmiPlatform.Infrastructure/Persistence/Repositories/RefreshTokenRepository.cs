using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Infrastructure.Mappers;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories
{
    public class RefreshTokenRepository : IRefreshTokenRepository
    {
        private readonly PetOmniDbContext _context;
        public RefreshTokenRepository(PetOmniDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(RefreshTokensDomain refreshToken)
        {
            var entity = refreshToken.ToEntity();
            await _context.RefreshTokens.AddAsync(entity);
        }
        public async Task<List<RefreshTokensDomain>> GetActiveTokensByUserIdAsync(Guid userId)
        {
            var entities = await _context.RefreshTokens.Where(rt => rt.UserId == userId && !rt.IsRevoked && rt.ExpiresAt > DateTime.UtcNow).ToListAsync();
            return entities.Select(e => e.ToDomain()).ToList();
        }

        public async Task<RefreshTokensDomain> GetByTokenHashAsync(string tokenHash)
        {
            var entity = _context.RefreshTokens.FirstOrDefault(rt => rt.TokenHash == tokenHash);
            return entity?.ToDomain();
        }

        public async Task UpdateAsync(RefreshTokensDomain refreshToken)
        {
            var entity = await _context.RefreshTokens.FindAsync(refreshToken.Id);
            if (entity == null) return;

            entity.TokenHash = refreshToken.TokenHash;
            entity.IsRevoked = refreshToken.IsRevoked;
            entity.RevokedAt = refreshToken.RevokedAt;
            entity.ReplacedByToken = refreshToken.ReplacedByTokenId;
            entity.LastUsedAt = refreshToken.LastUsedAt;
        }
    }
}
