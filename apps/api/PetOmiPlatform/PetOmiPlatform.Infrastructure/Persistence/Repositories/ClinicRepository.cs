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

            entity.ClinicName = clinic.ClinicName;
            entity.Address = clinic.Address;
            entity.Phone = clinic.Phone;
            entity.Email = clinic.Email;
            entity.LicenseNumber = clinic.LicenseNumber;
            entity.Status = clinic.Status.ToString();
            entity.RejectedReason = clinic.RejectedReason;
            entity.ReviewedByAdminId = clinic.ReviewedByAdminId;
            entity.CreatedAt = clinic.CreatedAt;
            entity.UpdatedAt = clinic.UpdatedAt;
        }
    }
}
