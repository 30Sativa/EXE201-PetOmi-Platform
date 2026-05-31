using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Domain.Common.Constants;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Infrastructure.Mappers;
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

        public async Task AddAsync(VetClinicDomain vetClinic)
        {
            var entity = vetClinic.ToEntity();
            await _context.VetClinics.AddAsync(entity);
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

        public async Task<bool> ExistsAsync(Guid vetProfileId, Guid clinicId)
        {
            return await _context.VetClinics.AnyAsync(vc => vc.VetProfileId == vetProfileId
               && vc.ClinicId == clinicId
                && vc.IsActive);
        }

        public async Task<bool> IsClinicApprovedAsync(Guid clinicId)
        {
            return await _context.Clinics.AnyAsync(c => c.ClinicId == clinicId && c.Status == "Approved");
        }

        public Task<bool> IsClinicOwnerAsync(Guid userId, Guid clinicId)
        {
            return _context.VetClinics.AnyAsync(vc=> vc.VetProfile.UserId == userId
               && vc.ClinicId == clinicId
                && vc.IsActive);
        }

        public async Task<VetClinicDomain?> GetByUserIdAndClinicIdAsync(Guid userId, Guid clinicId)
        {
            var entity = await _context.VetClinics
                .FirstOrDefaultAsync(vc => vc.VetProfile.UserId == userId && vc.ClinicId == clinicId && vc.IsActive);

            return entity?.ToDomain();
        }

        public async Task<VetClinicDomain?> GetByVetClinicIdAsync(Guid vetClinicId)
        {
            var entity = await _context.VetClinics
                .FirstOrDefaultAsync(vc => vc.VetClinicId == vetClinicId);
            return entity?.ToDomain();
        }

        public async Task<VetClinicDomain?> GetActiveByVetClinicIdAndClinicIdAsync(Guid vetClinicId, Guid clinicId)
        {
            var entity = await _context.VetClinics
                .FirstOrDefaultAsync(vc =>
                    vc.VetClinicId == vetClinicId &&
                    vc.ClinicId == clinicId &&
                    vc.IsActive);
            return entity?.ToDomain();
        }

        public async Task<List<Guid>> GetAllVetClinicIdsAsync(Guid vetProfileId)
        {
            return await _context.VetClinics
                .Where(vc => vc.VetProfileId == vetProfileId && vc.IsActive)
                .Select(vc => vc.VetClinicId)
                .ToListAsync();
        }

        public async Task UpdateAsync(VetClinicDomain vetClinic)
        {
            var entity = await _context.VetClinics
                .FirstOrDefaultAsync(vc => vc.VetClinicId == vetClinic.Id)
                ?? throw new InvalidOperationException("VetClinic khong ton tai de cap nhat.");

            entity.RoleId = vetClinic.RoleId;
            entity.IsActive = vetClinic.IsActive;
            entity.UpdatedAt = vetClinic.UpdatedAt;
            if (!vetClinic.IsActive && entity.EndDate == null)
            {
                entity.EndDate = DateOnly.FromDateTime(DateTime.UtcNow);
            }
        }

        public async Task<List<ClinicDoctorDto>> GetClinicDoctorsAsync(Guid clinicId)
        {
            return await _context.VetClinics
                .AsNoTracking()
                .Where(vc => vc.ClinicId == clinicId && vc.IsActive)
                .Include(vc => vc.VetProfile)
                    .ThenInclude(vp => vp.User!)
                        .ThenInclude(u => u.UserProfile)
                .Include(vc => vc.Role)
                .Where(vc => vc.VetProfile.IsActive)
                .Select(vc => new ClinicDoctorDto
                {
                    VetClinicId = vc.VetClinicId,
                    VetProfileId = vc.VetProfile.VetProfileId,
                    UserId = vc.VetProfile.UserId,
                    FullName = vc.VetProfile.User != null && vc.VetProfile.User.UserProfile != null
                        ? vc.VetProfile.User.UserProfile.FullName
                        : (vc.VetProfile.User != null ? vc.VetProfile.User.Email : "Unknown"),
                    AvatarUrl = vc.VetProfile.User != null && vc.VetProfile.User.UserProfile != null
                        ? vc.VetProfile.User.UserProfile.AvatarUrl : null,
                    Specialization = vc.VetProfile.Specialization,
                    RoleName = vc.Role.RoleName
                })
                .ToListAsync();
        }
    }
}
