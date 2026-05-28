using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Infrastructure.Common.Utils;
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

        public async Task UpdateAsync(ClinicDomain clinic)
        {
            var entity = await _context.Clinics.FindAsync(clinic.Id);
            if (entity == null) return;

            var updated = clinic.ToEntity();
            _context.Entry(entity).CurrentValues.SetValues(updated);
            entity.Status = clinic.Status.ToString();
        }

        public async Task<(List<ClinicDomain> Items, int TotalCount)> SearchAsync(
            double? userLat, double? userLng,
            string? keyword, string? city,
            int radiusKm, int page, int pageSize)
        {
            var query = _context.Clinics
                .Where(c => c.Status == "Approved")
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var kw = keyword.Trim().ToLower();
                query = query.Where(c =>
                    (c.ClinicName != null && c.ClinicName.ToLower().Contains(kw)) ||
                    (c.Address != null && c.Address.ToLower().Contains(kw)));
            }

            if (!string.IsNullOrWhiteSpace(city))
            {
                var cityStr = city.Trim().ToLower();
                query = query.Where(c =>
                    c.Address != null && c.Address.ToLower().Contains(cityStr));
            }

            var raw = await query
                .Select(c => new
                {
                    c.ClinicId,
                    c.ClinicName,
                    c.Address,
                    c.LogoUrl,
                    c.Description,
                    c.Latitude,
                    c.Longitude,
                    c.OpeningHours,
                    c.AppointmentBufferMins,
                    Entity = c
                })
                .ToListAsync();

            var hasLocation = userLat.HasValue && userLng.HasValue;

            var withDistance = raw
                .Select(c =>
                {
                    double? distKm = null;
                    if (hasLocation && c.Latitude.HasValue && c.Longitude.HasValue)
                    {
                        distKm = GeoUtils.CalculateHaversineDistanceKm(
                            userLat!.Value, userLng!.Value,
                            c.Latitude!.Value, c.Longitude!.Value);
                    }
                    return new
                    {
                        Domain = c.Entity.ToDomain(),
                        DistanceKm = distKm.HasValue ? Math.Round(distKm.Value, 2) : (double?)null,
                        c.Latitude,
                        c.Longitude,
                        c.OpeningHours,
                        c.AppointmentBufferMins
                    };
                })
                .Where(x => !hasLocation || (x.DistanceKm.HasValue && x.DistanceKm.Value <= radiusKm))
                .ToList();

            var totalCount = withDistance.Count;

            var paged = withDistance
                .OrderBy(x => hasLocation ? x.DistanceKm ?? double.MaxValue : 0)
                .ThenBy(x => x.Domain.ClinicName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            var items = paged.Select(x => x.Domain).ToList();

            return (items, totalCount);
        }

        public async Task<int> GetBufferMinsAsync(Guid clinicId)
        {
            return await _context.Clinics
                .Where(c => c.ClinicId == clinicId)
                .Select(c => c.AppointmentBufferMins)
                .FirstOrDefaultAsync();
        }

        public async Task<Dictionary<string, int>> GetClinicCountByStatusAsync()
        {
            return await _context.Clinics
                .GroupBy(c => c.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Status, x => x.Count);
        }

        public async Task<Dictionary<string, int>> GetClinicCreatedTrendAsync(int days = 30)
        {
            var startDate = DateTime.UtcNow.AddDays(-days).Date;

            var data = await _context.Clinics
                .Where(c => c.CreatedAt >= startDate)
                .GroupBy(c => c.CreatedAt.Date)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .ToListAsync();

            var result = new Dictionary<string, int>();
            for (int i = days; i >= 0; i--)
            {
                var date = DateTime.UtcNow.Date.AddDays(-i);
                var key = date.ToString("yyyy-MM-dd");
                result[key] = data.FirstOrDefault(d => d.Date == date)?.Count ?? 0;
            }

            return result;
        }
    }
}
