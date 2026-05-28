using MediatR;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;
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
        var (clinics, totalCount) = await _clinicRepository.SearchAsync(
            request.Latitude, request.Longitude,
            request.Keyword, request.City,
            request.RadiusKm, request.Page, request.PageSize);

        var items = clinics.Select(c => new ClinicSearchResult
        {
            ClinicId = c.Id,
            ClinicName = c.ClinicName,
            Address = c.Address,
            LogoUrl = c.LogoUrl,
            Description = c.Description,
            Latitude = c.Latitude,
            Longitude = c.Longitude,
            OpeningHours = c.OpeningHours,
            AppointmentBufferMins = c.AppointmentBufferMins
        }).ToList();

        return new PagedSearchClinicsResponse
        {
            Items = items,
            Meta = new PaginationMeta<ClinicSearchResult>
            {
                PageNumber = request.Page,
                PageSize = request.PageSize,
                TotalRecords = totalCount
            }
        };
    }
}
