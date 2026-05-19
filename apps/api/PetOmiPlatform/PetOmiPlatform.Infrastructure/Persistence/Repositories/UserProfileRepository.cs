using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Infrastructure.Mappers;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;
using System;
using System.Threading.Tasks;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories
{
    public class UserProfileRepository : IUserProfileRepository
    {
        private readonly PetOmniDbContext _context;

        public UserProfileRepository(PetOmniDbContext context)
        {
            _context = context;
        }

        public async Task<UserProfileDomain?> GetByUserIdAsync(Guid userId)
        {
            var entity = await _context.UserProfiles
                .FirstOrDefaultAsync(p => p.UserId == userId);
            return entity?.ToDomain();
        }

        public async Task AddAsync(UserProfileDomain profile)
        {
            var entity = profile.ToEntity();
            await _context.UserProfiles.AddAsync(entity);
        }

        public async Task UpdateAsync(UserProfileDomain profile)
        {
            var entity = await _context.UserProfiles.FirstOrDefaultAsync(p => p.ProfileId == profile.Id);
            if (entity == null) return;

            entity.FullName = profile.FullName;
            entity.Phone = profile.Phone;
            entity.AvatarUrl = profile.AvatarUrl;
            entity.DateOfBirth = profile.DateOfBirth;
            entity.Gender = profile.Gender;
            entity.Address = profile.Address;
            entity.UpdatedAt = profile.UpdatedAt;
        }
    }
}
