using MediatR;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Response;
using System;

namespace PetOmiPlatform.Application.Features.Appointment.Query
{
    public record GetOwnerAppointmentsQuery(
        Guid OwnerUserId,
        int Page,
        int PageSize
    ) : IRequest<PagedData<AppointmentListItemResponse>>;
}
