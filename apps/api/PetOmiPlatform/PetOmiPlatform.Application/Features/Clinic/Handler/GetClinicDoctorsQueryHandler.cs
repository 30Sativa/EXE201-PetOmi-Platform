using MediatR;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Clinic.Handler
{
    public class GetClinicDoctorsQueryHandler
        : IRequestHandler<GetClinicDoctorsQuery, IReadOnlyList<ClinicDoctorListItemResponse>>
    {
        private readonly IVetClinicRepository _vetClinicRepository;

        public GetClinicDoctorsQueryHandler(IVetClinicRepository vetClinicRepository)
        {
            _vetClinicRepository = vetClinicRepository;
        }

        public async Task<IReadOnlyList<ClinicDoctorListItemResponse>> Handle(
            GetClinicDoctorsQuery request,
            CancellationToken cancellationToken)
        {
            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(request.RequestUserId, request.ClinicId);
            ClinicRoleGuard.RequireActiveStaff(staff);

            var doctors = await _vetClinicRepository.GetClinicDoctorsAsync(request.ClinicId);

            return doctors.Select(d => new ClinicDoctorListItemResponse
            {
                VetClinicId = d.VetClinicId,
                VetProfileId = d.VetProfileId,
                UserId = d.UserId,
                FullName = d.FullName,
                AvatarUrl = d.AvatarUrl,
                Specialization = d.Specialization,
                RoleName = d.RoleName
            }).ToList();
        }
    }
}
