using PetOmiPlatform.Domain.Common.Constants;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;
using PetOmiPlatform.Infrastructure.Persistence.Entities;

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
    }
}
