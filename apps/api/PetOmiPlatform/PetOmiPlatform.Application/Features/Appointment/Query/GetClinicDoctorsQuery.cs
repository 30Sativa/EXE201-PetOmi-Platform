using MediatR;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Appointment.Query;

public record GetClinicDoctorsQuery(
    Guid ClinicId
) : IRequest<System.Collections.Generic.List<ClinicDoctorResponse>>;
