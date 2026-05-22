using MediatR;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Clinic.Handler
{
    public class GetDoctorSchedulesQueryHandler
        : IRequestHandler<GetDoctorSchedulesQuery, IEnumerable<DoctorScheduleResponse>>
    {
        private readonly IDoctorScheduleRepository _scheduleRepo;

        public GetDoctorSchedulesQueryHandler(IDoctorScheduleRepository scheduleRepo)
            => _scheduleRepo = scheduleRepo;

        public async Task<IEnumerable<DoctorScheduleResponse>> Handle(
            GetDoctorSchedulesQuery request, CancellationToken cancellationToken)
        {
            var schedules = await _scheduleRepo.GetByClinicIdAsync(request.ClinicId);
            return schedules.Select(DoctorScheduleResponse.FromDomain).ToList();
        }
    }
}
