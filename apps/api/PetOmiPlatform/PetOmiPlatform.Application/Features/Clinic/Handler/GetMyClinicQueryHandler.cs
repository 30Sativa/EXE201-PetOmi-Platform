using MediatR;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Clinic.Handler
{
    public class GetMyClinicQueryHandler : IRequestHandler<GetMyClinicQuery, GetMyClinicResponse?>
    {
        private readonly IClinicRepository _clinicRepository;

        public GetMyClinicQueryHandler(IClinicRepository clinicRepository)
        {
            _clinicRepository = clinicRepository;
        }

        public async Task<GetMyClinicResponse?> Handle(GetMyClinicQuery request, CancellationToken cancellationToken)
        {
            var clinic = await _clinicRepository.GetByOwnerUserIdAsync(request.UserId);
            if (clinic == null) return null;

            return new GetMyClinicResponse
            {
                ClinicId = clinic.Id,
                ClinicName = clinic.ClinicName,
                Address = clinic.Address,
                Phone = clinic.Phone,
                Email = clinic.Email,
                LicenseNumber = clinic.LicenseNumber,
                LicenseImageUrl = clinic.LicenseImageUrl,
                Status = clinic.Status.ToString(),
                RejectedReason = clinic.RejectedReason,
                CreatedAt = clinic.CreatedAt,
                UpdatedAt = clinic.UpdatedAt
            };
        }
    }
}
