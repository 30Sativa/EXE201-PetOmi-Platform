using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Domain.Common.Constants;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Infrastructure.Mappers;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories
{
    public class ClinicRepository : IClinicRepository
    {
        private readonly PetOmniDbContext _context;

        public ClinicRepository(PetOmniDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(ClinicDomain clinic)
        {
            await _context.Clinics.AddAsync(clinic.ToEntity());
        }

        public async Task<ClinicDomain?> GetByIdAsync(Guid clinicId)
        {
            var entity = await _context.Clinics.FindAsync(clinicId);
            return entity?.ToDomain();
        }

        public async Task<bool> ExistsByLicenseNumberAsync(string licenseNumber)
        {
            return await _context.Clinics
                .AnyAsync(c => c.LicenseNumber == licenseNumber);
        }

        public async Task UpdateAsync(ClinicDomain clinic)
        {
            var entity = await _context.Clinics.FindAsync(clinic.Id);
            if (entity == null) return;

            var updated = clinic.ToEntity();
            _context.Entry(entity).CurrentValues.SetValues(updated);
            entity.Status = clinic.Status.ToString();
        }

        public async Task<(IEnumerable<ClinicDomain> Items, int TotalCount)> GetByStatusAsync(
            string status, int page, int pageSize)
        {
            var query = _context.Clinics
                .Where(c => c.Status == status)
                .OrderByDescending(c => c.CreatedAt);

            var total = await query.CountAsync();
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => c.ToDomain())
                .ToListAsync();

            return (items, total);
        }

        public async Task<ClinicDomain?> GetByOwnerUserIdAsync(Guid userId)
        {
            // Tìm clinic mà user này đang là ClinicOwner (active)
            // VetProfile -> VetClinic -> Clinic, role = ClinicOwner
            var clinicId = await _context.VetClinics
                .Where(vc => vc.VetProfile.UserId == userId
                          && vc.RoleId == ClinicRoleConstants.ClinicOwnerId
                          && vc.IsActive)
                .Select(vc => (Guid?)vc.ClinicId)
                .FirstOrDefaultAsync();

            if (clinicId == null) return null;

            var entity = await _context.Clinics.FindAsync(clinicId.Value);
            return entity?.ToDomain();
        }
    }
}
