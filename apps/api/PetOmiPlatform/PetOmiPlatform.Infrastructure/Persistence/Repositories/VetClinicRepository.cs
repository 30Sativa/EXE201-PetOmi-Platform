using PetOmiPlatform.Domain.Common.Constants;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;
using PetOmiPlatform.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories
{
    public class VetClinicRepository : IVetClinicRepository
    {
        private readonly PetOmniDbContext _context;

        public VetClinicRepository(PetOmniDbContext context)
        {
            _context = context;
        }

        public async Task AddClinicOwnerAsync(Guid vetProfileId, Guid clinicId)
        {
            var now = DateTime.UtcNow;
            var vetClinic = new VetClinic
            {
                VetClinicId = Guid.NewGuid(),
                VetProfileId = vetProfileId,
                ClinicId = clinicId,
                RoleId = ClinicRoleConstants.ClinicOwnerId,
                StartDate = DateOnly.FromDateTime(now),
                IsActive = true,
                CreatedAt = now
            };

            await _context.VetClinics.AddAsync(vetClinic);
        }

        public async Task DeactivateByClinicIdAsync(Guid clinicId)
        {
            var now = DateTime.UtcNow;
            var endDate = DateOnly.FromDateTime(now);
            var vetClinics = await _context.VetClinics
                .Where(vc => vc.ClinicId == clinicId && vc.IsActive)
                .ToListAsync();

            foreach (var vetClinic in vetClinics)
            {
                vetClinic.IsActive = false;
                vetClinic.EndDate = endDate;
                vetClinic.UpdatedAt = now;
            }
        }
    }
}
