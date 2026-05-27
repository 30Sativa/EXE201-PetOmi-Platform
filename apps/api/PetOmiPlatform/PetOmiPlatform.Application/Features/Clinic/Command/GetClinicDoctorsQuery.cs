using MediatR;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Clinic.Command
{
    /// <summary>Lay danh sach bac si/staff active cua clinic cho man hinh quan ly noi bo.</summary>
    public record GetClinicDoctorsQuery(Guid RequestUserId, Guid ClinicId)
        : IRequest<IReadOnlyList<ClinicDoctorListItemResponse>>;
}
