using MediatR;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Clinic.Command;

public record SearchClinicPetsQuery(
    Guid RequestUserId,
    Guid ClinicId,
    string? Search,
    int Limit) : IRequest<IReadOnlyList<ClinicPetSearchItemResponse>>;
