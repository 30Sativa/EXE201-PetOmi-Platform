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

        public async Task UpdateAsync(ClinicDomain clinic)
        {
            var entity = await _context.Clinics.FindAsync(clinic.Id);
            if (entity == null) return;

            var updated = clinic.ToEntity();
            _context.Entry(entity).CurrentValues.SetValues(updated);
            entity.Status = clinic.Status.ToString();
        }

        public async Task<(List<ClinicSearchResultDto> Items, int TotalCount)> SearchAsync(
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

            var all = await query
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
                    c.AppointmentBufferMins
                })
                .ToListAsync();

            var hasLocation = userLat.HasValue && userLng.HasValue;

            var withDistance = all
                .Select(c =>
                {
                    double? distKm = null;
                    if (hasLocation && c.Latitude.HasValue && c.Longitude.HasValue)
                    {
                        distKm = CalculateHaversineDistanceKm(
                            userLat!.Value, userLng!.Value,
                            c.Latitude!.Value, c.Longitude!.Value);
                    }
                    return new ClinicSearchResultDto
                    {
                        ClinicId = c.ClinicId,
                        ClinicName = c.ClinicName,
                        Address = c.Address,
                        LogoUrl = c.LogoUrl,
                        Description = c.Description,
                        Latitude = c.Latitude,
                        Longitude = c.Longitude,
                        DistanceKm = distKm.HasValue ? Math.Round(distKm.Value, 2) : null,
                        OpeningHours = c.OpeningHours,
                        AppointmentBufferMins = c.AppointmentBufferMins
                    };
                })
                .Where(x => !hasLocation || (x.DistanceKm.HasValue && x.DistanceKm.Value <= radiusKm))
                .ToList();

            var totalCount = withDistance.Count;
            var paged = withDistance
                .OrderBy(x => hasLocation ? x.DistanceKm ?? double.MaxValue : 0)
                .ThenBy(x => x.ClinicName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return (paged, totalCount);
        }

        private static double CalculateHaversineDistanceKm(
            double lat1, double lon1, double lat2, double lon2)
        {
            const double R = 6371.0;
            var dLat = (lat2 - lat1) * Math.PI / 180.0;
            var dLon = (lon2 - lon1) * Math.PI / 180.0;
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return R * c;
        }

        public async Task<int> GetBufferMinsAsync(Guid clinicId)
        {
            var clinic = await _context.Clinics
                .Where(c => c.ClinicId == clinicId)
                .Select(c => c.AppointmentBufferMins)
                .FirstOrDefaultAsync();
            return clinic;
        }
    }
}
