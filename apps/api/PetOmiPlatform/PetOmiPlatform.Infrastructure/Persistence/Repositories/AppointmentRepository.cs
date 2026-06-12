using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Infrastructure.Mappers;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories
{
    public class AppointmentRepository : IAppointmentRepository
    {
        private readonly PetOmniDbContext _context;

        public AppointmentRepository(PetOmniDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(AppointmentDomain appointment)
        {
            await _context.Appointments.AddAsync(appointment.ToEntity());
        }

        public async Task<AppointmentDomain?> GetByIdAsync(Guid appointmentId)
        {
            var entity = await _context.Appointments
                .FirstOrDefaultAsync(a => a.AppointmentId == appointmentId);
            return entity?.ToDomain();
        }

        public async Task<IEnumerable<AppointmentDomain>> GetByClinicAsync(
            Guid clinicId, string? status, DateOnly? date, string? search, int page, int pageSize)
        {
            var query = ApplyClinicAppointmentFilters(clinicId, status, date, search);

            return await query
                .OrderBy(a => a.AppointmentDate)
                .ThenBy(a => a.StartTime)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => a.ToDomain())
                .ToListAsync();
        }

        public async Task<int> CountByClinicAsync(Guid clinicId, string? status, DateOnly? date, string? search)
        {
            return await ApplyClinicAppointmentFilters(clinicId, status, date, search).CountAsync();
        }

        private IQueryable<global::PetOmiPlatform.Infrastructure.Persistence.Entities.Appointment> ApplyClinicAppointmentFilters(
            Guid clinicId,
            string? status,
            DateOnly? date,
            string? search)
        {
            var query = _context.Appointments
                .AsNoTracking()
                .Where(a => a.ClinicId == clinicId);

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(a => a.Status == status);

            if (date.HasValue)
                query = query.Where(a => a.AppointmentDate == date.Value);

            var keyword = search?.Trim();
            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var like = $"%{keyword}%";
                var normalizedKeyword = keyword.Replace("-", string.Empty);
                var normalizedLike = $"%{normalizedKeyword}%";
                var isWalkInSearch = "walk-in".Contains(keyword, StringComparison.OrdinalIgnoreCase)
                    || "walkin".Contains(normalizedKeyword, StringComparison.OrdinalIgnoreCase);

                query = query.Where(a =>
                    EF.Functions.Like(a.AppointmentId.ToString(), like) ||
                    EF.Functions.Like(a.PetId.ToString(), like) ||
                    (a.VetClinicId != null && EF.Functions.Like(a.VetClinicId.Value.ToString(), like)) ||
                    EF.Functions.Like(a.AppointmentId.ToString().Replace("-", string.Empty), normalizedLike) ||
                    EF.Functions.Like(a.PetId.ToString().Replace("-", string.Empty), normalizedLike) ||
                    (a.VetClinicId != null && EF.Functions.Like(a.VetClinicId.Value.ToString().Replace("-", string.Empty), normalizedLike)) ||
                    EF.Functions.Like(a.AppointmentType, like) ||
                    EF.Functions.Like(a.Status, like) ||
                    (a.Notes != null && EF.Functions.Like(a.Notes, like)) ||
                    EF.Functions.Like(a.Pet.Name, like) ||
                    EF.Functions.Like(a.Pet.Species, like) ||
                    (a.Pet.Breed != null && EF.Functions.Like(a.Pet.Breed, like)) ||
                    EF.Functions.Like(a.BookedByUser.Email, like) ||
                    (a.Service != null && EF.Functions.Like(a.Service.ServiceName, like)) ||
                    (isWalkInSearch && a.IsWalkIn));
            }

            return query;
        }

        public async Task<IEnumerable<AppointmentDomain>> GetByOwnerAsync(
            Guid ownerUserId, int page, int pageSize)
        {
            return await _context.Appointments
                .Where(a => a.BookedByUserId == ownerUserId)
                .OrderByDescending(a => a.AppointmentDate)
                .ThenByDescending(a => a.StartTime)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => a.ToDomain())
                .ToListAsync();
        }

        public async Task<int> CountByOwnerAsync(Guid ownerUserId)
        {
            return await _context.Appointments
                .CountAsync(a => a.BookedByUserId == ownerUserId);
        }

        public async Task<IEnumerable<AppointmentDomain>> GetByPetIdAsync(Guid petId, int page, int pageSize)
        {
            return await _context.Appointments
                .Where(a => a.PetId == petId)
                .OrderByDescending(a => a.AppointmentDate)
                .ThenByDescending(a => a.StartTime)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => a.ToDomain())
                .ToListAsync();
        }

        public async Task<int> CountByPetIdAsync(Guid petId)
        {
            return await _context.Appointments
                .CountAsync(a => a.PetId == petId);
        }

        public async Task<bool> HasConflictAsync(
            Guid vetClinicId,
            DateOnly date,
            TimeOnly startTime,
            TimeOnly endTime,
            Guid? excludeId = null)
        {
            var query = _context.Appointments.Where(a =>
                a.VetClinicId == vetClinicId &&
                a.AppointmentDate == date &&
                (a.Status == "Pending" || a.Status == "Confirmed" || a.Status == "CheckedIn") &&
                a.StartTime < endTime &&
                a.EndTime > startTime);

            if (excludeId.HasValue)
                query = query.Where(a => a.AppointmentId != excludeId.Value);

            return await query.AnyAsync();
        }

        public async Task<bool> HasDoctorConflictAcrossClinicsAsync(
            List<Guid> allVetClinicIds,
            DateOnly date,
            TimeOnly startTime,
            TimeOnly endTime,
            Guid? excludeId = null)
        {
            if (!allVetClinicIds.Any())
                return false;

            var query = _context.Appointments
                .Where(a => allVetClinicIds.Contains(a.VetClinicId ?? Guid.Empty)
                    && a.AppointmentDate == date
                    && (a.Status == "Pending" || a.Status == "Confirmed" || a.Status == "CheckedIn")
                    && a.StartTime < endTime
                    && a.EndTime > startTime);

            if (excludeId.HasValue)
                query = query.Where(a => a.AppointmentId != excludeId.Value);

            return await query.AnyAsync();
        }

        public async Task<IEnumerable<AppointmentDomain>> GetPendingExpiredAsync(int timeoutMinutes = 30)
        {
            var cutoff = DateTime.UtcNow.AddMinutes(-timeoutMinutes);

            return await _context.Appointments
                .Where(a => a.Status == "Pending" && a.CreatedAt <= cutoff)
                .Select(a => a.ToDomain())
                .ToListAsync();
        }

        public async Task UpdateAsync(AppointmentDomain appointment)
        {
            var entity = await _context.Appointments
                .FirstOrDefaultAsync(a => a.AppointmentId == appointment.Id);
            if (entity == null) return;

            var updated = appointment.ToEntity();
            _context.Entry(entity).CurrentValues.SetValues(updated);
        }

        public async Task<int> CountAllAsync()
        {
            return await _context.Appointments.CountAsync();
        }
    }
}
