using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;

namespace PetOmiPlatform.Infrastructure.Mappers
{
    public static class DoctorScheduleMapper
    {
        public static DoctorScheduleDomain ToDomain(this DoctorSchedule entity)
        {
            return DoctorScheduleDomain.Reconstitute(
                id: entity.ScheduleId,
                vetClinicId: entity.VetClinicId,
                dayOfWeek: entity.DayOfWeek,
                startTime: entity.StartTime,
                endTime: entity.EndTime,
                isActive: entity.IsActive,
                createdAt: entity.CreatedAt,
                updatedAt: entity.UpdatedAt
            );
        }

        public static DoctorSchedule ToEntity(this DoctorScheduleDomain domain)
        {
            return new DoctorSchedule
            {
                ScheduleId = domain.Id,
                VetClinicId = domain.VetClinicId,
                DayOfWeek = domain.DayOfWeek,
                StartTime = domain.StartTime,
                EndTime = domain.EndTime,
                IsActive = domain.IsActive,
                CreatedAt = domain.CreatedAt,
                UpdatedAt = domain.UpdatedAt
            };
        }
    }
}
