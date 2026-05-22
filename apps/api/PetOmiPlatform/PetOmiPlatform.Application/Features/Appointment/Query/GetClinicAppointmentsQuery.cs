using MediatR;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Response;
using System;

namespace PetOmiPlatform.Application.Features.Appointment.Query
{
    public record GetClinicAppointmentsQuery(
        Guid ClinicId,
        string? Status,
        DateOnly? Date,
        int Page,
        int PageSize
    ) : IRequest<PagedData<AppointmentListItemResponse>>;
}
