using MediatR;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Appointment.Query;

public record GetAvailableSlotsQuery(
    Guid ClinicId,
    DateOnly Date,
    Guid? ServiceId,
    Guid? VetClinicId
) : IRequest<System.Collections.Generic.List<AvailableSlotResponse>>;
