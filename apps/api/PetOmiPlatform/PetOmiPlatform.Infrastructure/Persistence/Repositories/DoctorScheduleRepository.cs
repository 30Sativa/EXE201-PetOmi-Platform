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

        public async Task<IEnumerable<DoctorScheduleDomain>> GetByClinicAndDayAsync(Guid clinicId, int dayOfWeek)
        {
            return await _context.DoctorSchedules
                .Where(s => s.VetClinic.ClinicId == clinicId &&
                            s.DayOfWeek == dayOfWeek &&
                            s.IsActive)
                .OrderBy(s => s.StartTime)
                .Select(s => s.ToDomain())
                .ToListAsync();
        }

        public async Task UpdateAsync(DoctorScheduleDomain schedule)
        {
            var entity = await _context.DoctorSchedules.FindAsync(schedule.Id);
            if (entity == null) return;
            _context.Entry(entity).CurrentValues.SetValues(schedule.ToEntity());
        }

        public async Task DeleteAsync(Guid scheduleId)
        {
            var entity = await _context.DoctorSchedules.FindAsync(scheduleId);
            if (entity != null)
                _context.DoctorSchedules.Remove(entity);
        }

        public async Task<List<DoctorScheduleWithDoctorDto>> GetByClinicAndDayWithDoctorAsync(Guid clinicId, int dayOfWeek, Guid? vetClinicId = null)
        {
            var query = _context.DoctorSchedules
                .Where(s => s.VetClinic.ClinicId == clinicId &&
                            s.DayOfWeek == dayOfWeek &&
                            s.IsActive &&
                            s.VetClinic.IsActive &&
                            s.VetClinic.VetProfile.IsActive);

            if (vetClinicId.HasValue)
                query = query.Where(s => s.VetClinicId == vetClinicId.Value);

            return await query
                .Include(s => s.VetClinic)
                    .ThenInclude(vc => vc.VetProfile)
                        .ThenInclude(vp => vp.User!)
                            .ThenInclude(u => u.UserProfile)
                .OrderBy(s => s.StartTime)
                .Select(s => new DoctorScheduleWithDoctorDto
                {
                    ScheduleId = s.ScheduleId,
                    VetClinicId = s.VetClinicId,
                    VetProfileId = s.VetClinic.VetProfileId,
                    DayOfWeek = s.DayOfWeek,
                    StartTime = s.StartTime,
                    EndTime = s.EndTime,
                    DoctorName = s.VetClinic.VetProfile.User != null && s.VetClinic.VetProfile.User.UserProfile != null
                        ? s.VetClinic.VetProfile.User.UserProfile.FullName
                        : (s.VetClinic.VetProfile.User != null ? s.VetClinic.VetProfile.User.Email : "Unknown"),
                    Specialization = s.VetClinic.VetProfile.Specialization
                })
                .ToListAsync();
        }
    }
}
