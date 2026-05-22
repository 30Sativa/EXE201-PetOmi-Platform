using MediatR;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Response;
using System;

namespace PetOmiPlatform.Application.Features.Appointment.Query
{
    public record GetAvailableSlotsQuery(
        Guid ClinicId,
        DateOnly Date,
        Guid? ServiceId
    ) : IRequest<List<AvailableSlotResponse>>;
}
