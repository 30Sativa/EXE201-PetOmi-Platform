using PetOmiPlatform.Application.Features.Appointment.DTOs.Response;
using PetOmiPlatform.Domain.Entities;

namespace PetOmiPlatform.Application.Features.Appointment.Handler
{
    /// <summary>Shared mapping helper tránh duplicate code giữa các handlers.</summary>
    internal static class AppointmentHandlerHelper
    {
        internal static AppointmentResponse ToResponse(AppointmentDomain d) => new()
        {
            AppointmentId = d.Id,
            ClinicId = d.ClinicId,
            VetClinicId = d.VetClinicId,
            ServiceId = d.ServiceId,
            PetId = d.PetId,
            BookedByUserId = d.BookedByUserId,
            AppointmentDate = d.AppointmentDate,
            StartTime = d.StartTime,
            EndTime = d.EndTime,
            AppointmentType = d.AppointmentType.ToString(),
            Status = d.Status.ToString(),
            Notes = d.Notes,
            CancellationReason = d.CancellationReason,
            IsWalkIn = d.IsWalkIn,
            IsLateCancellation = d.IsLateCancellation,
            ConfirmedAt = d.ConfirmedAt,
            CancelledAt = d.CancelledAt,
            CreatedAt = d.CreatedAt
        };

        internal static AppointmentListItemResponse ToListItem(AppointmentDomain d) => new()
        {
            AppointmentId = d.Id,
            PetId = d.PetId,
            VetClinicId = d.VetClinicId,
            AppointmentDate = d.AppointmentDate,
            StartTime = d.StartTime,
            EndTime = d.EndTime,
            AppointmentType = d.AppointmentType.ToString(),
            Status = d.Status.ToString(),
            IsWalkIn = d.IsWalkIn,
            CreatedAt = d.CreatedAt
        };
    }
}
