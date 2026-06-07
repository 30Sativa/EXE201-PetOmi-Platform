using MediatR;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Clinic.Handler
{
    public class GetMyClinicQueryHandler : IRequestHandler<GetMyClinicQuery, GetMyClinicResponse?>
    {
        private readonly IVetClinicRepository _vetClinicRepository;

        public GetMyClinicQueryHandler(IVetClinicRepository vetClinicRepository)
        {
            _vetClinicRepository = vetClinicRepository;
        }

        public async Task<GetMyClinicResponse?> Handle(GetMyClinicQuery request, CancellationToken cancellationToken)
        {
            var membership = await _vetClinicRepository.GetActiveMembershipByUserIdAsync(
                request.UserId,
                request.ActiveClinicId);
            if (membership == null) return null;

            return new GetMyClinicResponse
            {
                ClinicId = membership.ClinicId,
                ClinicName = membership.ClinicName,
                Address = membership.Address,
                Phone = membership.Phone,
                Email = membership.Email,
                LicenseNumber = membership.LicenseNumber,
                LicenseImageUrl = membership.LicenseImageUrl,
                LicenseCloudinaryPublicId = membership.LicenseCloudinaryPublicId,
                HasLicenseFile = !string.IsNullOrWhiteSpace(membership.LicenseImageUrl),
                LogoUrl = membership.LogoUrl,
                LogoCloudinaryPublicId = membership.LogoCloudinaryPublicId,
                Status = membership.Status,
                RejectedReason = membership.RejectedReason,
                CreatedAt = membership.CreatedAt,
                UpdatedAt = membership.UpdatedAt,
                VetClinicId = membership.VetClinicId,
                ClinicRoleId = membership.ClinicRoleId,
                ClinicRoleName = membership.ClinicRoleName,
                ClinicPermissions = membership.ClinicPermissions
            };
        }
    }
}
