using MediatR;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Clinic.Handler;

public class SearchClinicsQueryHandler
    : IRequestHandler<SearchClinicsQuery, PagedSearchClinicsResponse>
{
    private readonly IClinicRepository _clinicRepository;

    public SearchClinicsQueryHandler(IClinicRepository clinicRepository)
    {
        _clinicRepository = clinicRepository;
    }

    public async Task<PagedSearchClinicsResponse> Handle(
        SearchClinicsQuery request, CancellationToken cancellationToken)
    {
        var (items, totalCount) = await _clinicRepository.SearchAsync(
            request.Latitude, request.Longitude,
            request.Keyword, request.City,
            request.RadiusKm, request.Page, request.PageSize);

        var results = items.Select(x => new ClinicSearchResult
        {
            ClinicId = x.ClinicId,
            ClinicName = x.ClinicName,
            Address = x.Address,
            LogoUrl = x.LogoUrl,
            Description = x.Description,
            Latitude = x.Latitude,
            Longitude = x.Longitude,
            DistanceKm = x.DistanceKm,
            OpeningHours = x.OpeningHours,
            AppointmentBufferMins = x.AppointmentBufferMins
        }).ToList();

        var meta = new PaginationMeta<ClinicSearchResult>
        {
            PageNumber = request.Page,
            PageSize = request.PageSize,
            TotalRecords = totalCount
        };

        return new PagedSearchClinicsResponse { Items = results, Meta = meta };
    }
}
