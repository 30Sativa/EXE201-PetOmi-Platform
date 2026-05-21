using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Infrastructure.Mappers;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories
{
    public class DoctorScheduleRepository : IDoctorScheduleRepository
    {
        private readonly PetOmniDbContext _context;

        public DoctorScheduleRepository(PetOmniDbContext context) => _context = context;

        public async Task AddAsync(DoctorScheduleDomain schedule)
            => await _context.DoctorSchedules.AddAsync(schedule.ToEntity());

        public async Task<DoctorScheduleDomain?> GetByIdAsync(Guid scheduleId)
        {
            var entity = await _context.DoctorSchedules.FindAsync(scheduleId);
            return entity?.ToDomain();
        }

        public async Task<IEnumerable<DoctorScheduleDomain>> GetByVetClinicIdAsync(Guid vetClinicId, bool activeOnly = true)
        {
            var query = _context.DoctorSchedules.Where(s => s.VetClinicId == vetClinicId);
            if (activeOnly) query = query.Where(s => s.IsActive);
            return await query.OrderBy(s => s.DayOfWeek).ThenBy(s => s.StartTime)
                              .Select(s => s.ToDomain()).ToListAsync();
        }

        public async Task<IEnumerable<DoctorScheduleDomain>> GetByClinicIdAsync(Guid clinicId, bool activeOnly = true)
        {
            // Join qua VetClinic để lấy lịch tất cả bác sĩ trong clinic
            var query = _context.DoctorSchedules
                .Where(s => s.VetClinic.ClinicId == clinicId);
            if (activeOnly) query = query.Where(s => s.IsActive);
            return await query.OrderBy(s => s.DayOfWeek).ThenBy(s => s.StartTime)
                              .Select(s => s.ToDomain()).ToListAsync();
        }

        public async Task UpdateAsync(DoctorScheduleDomain schedule)
        {
            var entity = await _context.DoctorSchedules.FindAsync(schedule.Id);
            if (entity == null) return;
            _context.Entry(entity).CurrentValues.SetValues(schedule.ToEntity());
        }
    }
}
