using MediatR;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Clinic.Handler
{
    public class GetClinicsByStatusQueryHandler
        : IRequestHandler<GetClinicsByStatusQuery, PagedData<ClinicListItemResponse>>
    {
        private readonly IClinicRepository _clinicRepository;

        public GetClinicsByStatusQueryHandler(IClinicRepository clinicRepository)
        {
            _clinicRepository = clinicRepository;
        }

        public async Task<PagedData<ClinicListItemResponse>> Handle(
            GetClinicsByStatusQuery request, CancellationToken cancellationToken)
        {
            var items = await _clinicRepository.GetByStatusAsync(
                request.Status, request.Page, request.PageSize);
            var total = await _clinicRepository.CountByStatusAsync(request.Status);

            var dtos = items.Select(c => new ClinicListItemResponse
            {
                ClinicId = c.Id,
                ClinicName = c.ClinicName,
                Address = c.Address,
                Phone = c.Phone,
                Email = c.Email,
                LicenseNumber = c.LicenseNumber,
                LicenseImageUrl = c.LicenseImageUrl,
                LicenseCloudinaryPublicId = c.LicenseCloudinaryPublicId,
                Status = c.Status.ToString(),
                RejectedReason = c.RejectedReason,
                CreatedAt = c.CreatedAt
            }).ToList();

            return new PagedData<ClinicListItemResponse>
            {
                Items = dtos,
                Meta = new PaginationMeta<ClinicListItemResponse>
                {
                    PageNumber = request.Page,
                    PageSize = request.PageSize,
                    TotalRecords = total
                }
            };
        }
    }
}
