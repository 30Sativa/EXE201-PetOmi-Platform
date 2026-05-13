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
    public class VetProfileRepository : IVetProfileRepository
    {
        private readonly PetOmniDbContext _context;

        public VetProfileRepository(PetOmniDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(VetProfileDomain vetProfile)
        {
            var entity = vetProfile.ToEntity();
            await _context.VetProfiles.AddAsync(entity);
        }

        public async Task<VetProfileDomain?> GetByUserIdAsync(Guid userId)
        {
            var entity = await _context.VetProfiles
                .FirstOrDefaultAsync(v => v.UserId == userId);
            return entity?.ToDomain();
        }

        public async Task<VetProfileDomain?> GetByIdAsync(Guid vetProfileId)
        {
            var entity = await _context.VetProfiles
                .FindAsync(vetProfileId);
            return entity?.ToDomain();
        }
    }
}
