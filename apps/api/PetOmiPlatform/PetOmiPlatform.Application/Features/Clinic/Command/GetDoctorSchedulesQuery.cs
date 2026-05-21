using MediatR;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;

namespace PetOmiPlatform.Application.Features.Clinic.Command
{
    /// <summary>Lấy lịch làm việc của tất cả bác sĩ trong clinic.</summary>
    public record GetDoctorSchedulesQuery(Guid ClinicId) : IRequest<IEnumerable<DoctorScheduleResponse>>;
}
