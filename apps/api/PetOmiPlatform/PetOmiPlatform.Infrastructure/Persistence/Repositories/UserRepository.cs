using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Domain.ValueObjects;
using PetOmiPlatform.Infrastructure.Mappers;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories
{
    public class UserRepository : IUserRepository
    {

        private readonly PetOmniDbContext _context;

        public UserRepository(PetOmniDbContext context)
        {
            _context = context;
        }
        public async Task AddAsync(UserDomain user)
        {
            var entity = user.ToEntity();
            await _context.Users.AddAsync(entity);
        }

        public async Task<UserDomain?> GetByEmailAsync(Email email)
        {
            var entity = await _context.Users.FirstOrDefaultAsync(u => u.Email == email.Value);
            return entity?.ToDomain();
        }

        public async Task<UserDomain?> GetByIdAsync(Guid userId)
        {
            var entity = await _context.Users.FindAsync(userId);
            return entity?.ToDomain();
        }

        public async Task<UserDomain?> GetByNormalizedEmail(string normalizedEmail)
        {
            var entity = await _context.Users.FirstOrDefaultAsync(e => e.NormalizedEmail == normalizedEmail);
            return entity?.ToDomain();
        }

        public async Task UpdateAsync(UserDomain user)
        {
            var entity = user.ToEntity();
             _context.Users.Update(entity);

        }
    }
}
