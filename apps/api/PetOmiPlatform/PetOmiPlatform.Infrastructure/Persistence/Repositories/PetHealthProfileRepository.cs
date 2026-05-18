using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Infrastructure.Mappers;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;
using System;
using System.Threading.Tasks;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories
{
    public class PetHealthProfileRepository : IPetHealthProfileRepository
    {
        private readonly PetOmniDbContext _context;

        public PetHealthProfileRepository(PetOmniDbContext context)
        {
            _context = context;
        }

        public async Task<PetHealthProfileDomain?> GetByPetIdAsync(Guid petId)
        {
            var entity = await _context.PetHealthProfiles
                .FirstOrDefaultAsync(p => p.PetId == petId);
            return entity?.ToDomain();
        }

        public async Task AddAsync(PetHealthProfileDomain profile)
        {
            await _context.PetHealthProfiles.AddAsync(profile.ToEntity());
        }

        public async Task UpdateAsync(PetHealthProfileDomain profile)
        {
            var entity = await _context.PetHealthProfiles.FindAsync(profile.Id);
            if (entity == null) return;

            entity.CurrentWeightKg = profile.CurrentWeightKg;
            entity.Color = profile.Color;
            entity.IsNeutered = profile.IsNeutered;
            entity.Allergies = profile.Allergies;
            entity.ChronicConditions = profile.ChronicConditions;
            entity.MicrochipNumber = profile.MicrochipNumber;
            entity.UpdatedAt = profile.UpdatedAt;
        }
    }
}
