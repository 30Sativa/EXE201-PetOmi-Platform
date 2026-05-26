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
            var entity = await _context.Appointments.FindAsync(appointmentId);
            return entity?.ToDomain();
        }

        public async Task<IEnumerable<AppointmentDomain>> GetByClinicAsync(
            Guid clinicId, string? status, DateOnly? date, int page, int pageSize)
        {
            var query = _context.Appointments
                .Where(a => a.ClinicId == clinicId);

            if (!string.IsNullOrEmpty(status))
                query = query.Where(a => a.Status == status);

            if (date.HasValue)
                query = query.Where(a => a.AppointmentDate == date.Value);

            return await query
                .OrderBy(a => a.AppointmentDate)
                .ThenBy(a => a.StartTime)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => a.ToDomain())
                .ToListAsync();
        }

        public async Task<int> CountByClinicAsync(Guid clinicId, string? status, DateOnly? date)
        {
            var query = _context.Appointments.Where(a => a.ClinicId == clinicId);

            if (!string.IsNullOrEmpty(status))
                query = query.Where(a => a.Status == status);

            if (date.HasValue)
                query = query.Where(a => a.AppointmentDate == date.Value);

            return await query.CountAsync();
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
                (a.Status == "Pending" || a.Status == "Confirmed") &&
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
            TimeOnly endTime)
        {
            if (!allVetClinicIds.Any())
                return false;

            return await _context.Appointments
                .Where(a => allVetClinicIds.Contains(a.VetClinicId ?? Guid.Empty)
                    && a.AppointmentDate == date
                    && (a.Status == "Pending" || a.Status == "Confirmed")
                    && a.StartTime < endTime
                    && a.EndTime > startTime)
                .AnyAsync();
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
            var entity = await _context.Appointments.FindAsync(appointment.Id);
            if (entity == null) return;

            var updated = appointment.ToEntity();
            _context.Entry(entity).CurrentValues.SetValues(updated);
        }
    }
}
