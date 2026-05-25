using MediatR;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Clinic.Command;

public record SearchClinicsQuery(
    double? Latitude,
    double? Longitude,
    string? City,
    string? Keyword,
    int RadiusKm = 10,
    int Page = 1,
    int PageSize = 20
) : IRequest<PagedSearchClinicsResponse>;
