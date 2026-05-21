using MediatR;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Appointment.Command
{
    /// <summary>Clinic staff xem danh sách lịch hẹn của clinic.</summary>
    public record GetClinicAppointmentsQuery(
        Guid ClinicId,
        string? Status,
        DateOnly? Date,
        int Page,
        int PageSize
    ) : IRequest<PagedData<AppointmentListItemResponse>>;

    /// <summary>Owner xem lịch hẹn của mình.</summary>
    public record GetOwnerAppointmentsQuery(
        Guid OwnerUserId,
        int Page,
        int PageSize
    ) : IRequest<PagedData<AppointmentListItemResponse>>;

    /// <summary>Lấy danh sách slot trống của clinic trong ngày. Owner dùng khi đặt lịch.</summary>
    public record GetAvailableSlotsQuery(
        Guid ClinicId,
        DateOnly Date,
        Guid? ServiceId   // để tính DurationMins, nếu null thì mặc định 30 phút
    ) : IRequest<List<AvailableSlotResponse>>;
}
