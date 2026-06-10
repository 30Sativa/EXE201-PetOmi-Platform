using MediatR;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Clinic.Command
{
    /// <summary>Lấy danh sách bác sĩ/staff active của clinic cho màn hình quản lý nội bộ.</summary>
    public record GetClinicDoctorsQuery(Guid RequestUserId, Guid ClinicId)
        : IRequest<IReadOnlyList<ClinicDoctorListItemResponse>>;
}
