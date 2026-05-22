using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;

namespace PetOmiPlatform.Infrastructure.Mappers
{
    public static class AppointmentMapper
    {
        public static AppointmentDomain ToDomain(this Appointment entity) =>
            AppointmentDomain.Reconstitute(
                id: entity.AppointmentId,
                clinicId: entity.ClinicId,
                vetClinicId: entity.VetClinicId,
                serviceId: entity.ServiceId,
                petId: entity.PetId,
                bookedByUserId: entity.BookedByUserId,
                appointmentDate: entity.AppointmentDate,
                startTime: entity.StartTime,
                endTime: entity.EndTime,
                appointmentType: Enum.Parse<AppointmentType>(entity.AppointmentType),
                status: Enum.Parse<AppointmentStatus>(entity.Status),
                notes: entity.Notes,
                cancellationReason: entity.CancellationReason,
                isWalkIn: entity.IsWalkIn,
                isLateCancellation: entity.IsLateCancellation,
                confirmedAt: entity.ConfirmedAt,
                checkedInAt: entity.CheckedInAt,
                checkedInByUserId: entity.CheckedInByUserId,
                cancelledAt: entity.CancelledAt,
                cancelledByUserId: entity.CancelledByUserId,
                createdAt: entity.CreatedAt,
                updatedAt: entity.UpdatedAt
            );

        public static Appointment ToEntity(this AppointmentDomain domain) =>
            new Appointment
            {
                AppointmentId = domain.Id,
                ClinicId = domain.ClinicId,
                VetClinicId = domain.VetClinicId,
                ServiceId = domain.ServiceId,
                PetId = domain.PetId,
                BookedByUserId = domain.BookedByUserId,
                AppointmentDate = domain.AppointmentDate,
                StartTime = domain.StartTime,
                EndTime = domain.EndTime,
                AppointmentType = domain.AppointmentType.ToString(),
                Status = domain.Status.ToString(),
                Notes = domain.Notes,
                CancellationReason = domain.CancellationReason,
                IsWalkIn = domain.IsWalkIn,
                IsLateCancellation = domain.IsLateCancellation,
                ConfirmedAt = domain.ConfirmedAt,
                CheckedInAt = domain.CheckedInAt,
                CheckedInByUserId = domain.CheckedInByUserId,
                CancelledAt = domain.CancelledAt,
                CancelledByUserId = domain.CancelledByUserId,
                CreatedAt = domain.CreatedAt,
                UpdatedAt = domain.UpdatedAt
            };
    }
}
