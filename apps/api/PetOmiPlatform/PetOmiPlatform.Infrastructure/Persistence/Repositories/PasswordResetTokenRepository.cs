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
    public class PasswordResetTokenRepository : IPasswordResetTokenRepository
    {
        private readonly PetOmniDbContext _context;

        public PasswordResetTokenRepository(PetOmniDbContext context)
            => _context = context;

        public async Task AddAsync(PasswordResetTokenDomain token)
        {
            var entity = token.ToEntity();
            await _context.PasswordResetTokens.AddAsync(entity);
        }

        public async Task<PasswordResetTokenDomain?> GetByTokenAsync(string token)
        {
            var entity = await _context.PasswordResetTokens
                .FirstOrDefaultAsync(t => t.Token == token);
            return entity?.ToDomain();
        }

        public async Task UpdateAsync(PasswordResetTokenDomain token)
        {
            var entity = await _context.PasswordResetTokens
                .FindAsync(token.Id);
            if (entity == null) return;

            entity.IsUsed = token.IsUsed;
            entity.UsedAt = token.UsedAt;
        }
    }
}