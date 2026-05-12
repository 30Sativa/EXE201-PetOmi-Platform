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
    public class EmailVerificationTokenRepository : IEmailVerificationTokenRepository
    {
        private readonly PetOmniDbContext _context;

        public EmailVerificationTokenRepository(PetOmniDbContext context)
            => _context = context;

        public async Task AddAsync(EmailVerificationTokenDomain token)
        {
            var entity = token.ToEntity();
            await _context.EmailVerificationTokens.AddAsync(entity);
        }

        public async Task<EmailVerificationTokenDomain?> GetByTokenAsync(string token)
        {
            var entity = await _context.EmailVerificationTokens
                .FirstOrDefaultAsync(t => t.Token == token);
            return entity?.ToDomain();
        }

        public async Task<EmailVerificationTokenDomain?> GetLatestByUserIdAsync(Guid userId)
        {
            var entity = await _context.EmailVerificationTokens
                .Where(t => t.UserId == userId && !t.IsUsed)
                .OrderByDescending(t => t.CreatedAt)
                .FirstOrDefaultAsync();
            return entity?.ToDomain();
        }

        public async Task UpdateAsync(EmailVerificationTokenDomain token)
        {
            var entity = await _context.EmailVerificationTokens.FindAsync(token.Id);
            if (entity == null) return;

            entity.IsUsed = token.IsUsed;
            // UsedAt không có trong DB → không update
        }
    }
}
