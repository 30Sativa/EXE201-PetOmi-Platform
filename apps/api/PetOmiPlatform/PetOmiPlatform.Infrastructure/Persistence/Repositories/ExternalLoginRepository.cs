using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;
using PetOmiPlatform.Infrastructure.Persistence.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories
{
    public class ExternalLoginRepository : IExternalLoginRepository
    {
        private readonly PetOmniDbContext _context;

        public ExternalLoginRepository(PetOmniDbContext context)
        {
            _context = context;
        }

        public async Task<Guid?> GetUserIdByProviderAsync(string provider, string providerKey)
        {
            var entity = await _context.ExternalLogins
                .FirstOrDefaultAsync(e =>
                    e.Provider == provider &&
                    e.ProviderKey == providerKey);

            return entity?.UserId;
        }

        public async Task AddAsync(Guid userId, string provider, string providerKey, string? email)
        {
            var entity = new ExternalLogin
            {
                ExternalLoginId = Guid.NewGuid(),
                UserId = userId,
                Provider = provider,
                ProviderKey = providerKey,
                Email = email,
                CreatedAt = DateTime.UtcNow
            };
            await _context.ExternalLogins.AddAsync(entity);
        }
    }
}
