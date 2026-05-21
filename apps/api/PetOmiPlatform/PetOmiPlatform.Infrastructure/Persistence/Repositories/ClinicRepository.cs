using Microsoft.EntityFrameworkCore;
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

        /// <summary>
        /// Lấy clinic mà user đang sở hữu (có role ClinicOwner trong VetClinic).
        /// Join: VetClinic → VetProfile → Users → so sánh UserId.
        /// </summary>
        public async Task<ClinicDomain?> GetByOwnerUserIdAsync(Guid userId)
        {
            var entity = await _context.Clinics
                .FirstOrDefaultAsync(c => c.VetClinics.Any(vc =>
                    vc.IsActive &&
                    vc.Role.RoleName == "ClinicOwner" &&
                    vc.VetProfile.UserId == userId));
            return entity?.ToDomain();
        }

        public async Task<IEnumerable<ClinicDomain>> GetByStatusAsync(string status, int page, int pageSize)
        {
            return await _context.Clinics
                .Where(c => c.Status == status)
                .OrderByDescending(c => c.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => c.ToDomain())
                .ToListAsync();
        }

        public async Task<int> CountByStatusAsync(string status)
        {
            return await _context.Clinics.CountAsync(c => c.Status == status);
        }
    }
}
