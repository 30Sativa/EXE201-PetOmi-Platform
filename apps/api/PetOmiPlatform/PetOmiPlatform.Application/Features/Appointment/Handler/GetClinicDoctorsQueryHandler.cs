using MediatR;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Response;
using PetOmiPlatform.Application.Features.Appointment.Query;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Appointment.Handler;

public class GetClinicDoctorsQueryHandler
    : IRequestHandler<GetClinicDoctorsQuery, System.Collections.Generic.List<ClinicDoctorResponse>>
{
    private readonly IVetClinicRepository _vetClinicRepository;

    public GetClinicDoctorsQueryHandler(IVetClinicRepository vetClinicRepository)
    {
        _vetClinicRepository = vetClinicRepository;
    }

    public async Task<System.Collections.Generic.List<ClinicDoctorResponse>> Handle(
        GetClinicDoctorsQuery request, CancellationToken cancellationToken)
    {
        var doctors = await _vetClinicRepository.GetClinicDoctorsAsync(request.ClinicId);

        return doctors.Select(d => new ClinicDoctorResponse
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
