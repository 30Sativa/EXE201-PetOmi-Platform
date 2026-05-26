using MediatR;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Response;
using PetOmiPlatform.Application.Features.Appointment.Query;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Appointment.Handler
{
    public class GetAvailableSlotsQueryHandler
        : IRequestHandler<GetAvailableSlotsQuery, System.Collections.Generic.List<AvailableSlotResponse>>
    {
        private readonly IDoctorScheduleRepository _scheduleRepository;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IClinicServiceRepository _serviceRepository;
        private readonly IClinicRepository _clinicRepository;
        private readonly IVetClinicRepository _vetClinicRepository;

        public GetAvailableSlotsQueryHandler(
            IDoctorScheduleRepository scheduleRepository,
            IAppointmentRepository appointmentRepository,
            IClinicServiceRepository serviceRepository,
            IClinicRepository clinicRepository,
            IVetClinicRepository vetClinicRepository)
        {
            _scheduleRepository = scheduleRepository;
            _appointmentRepository = appointmentRepository;
            _serviceRepository = serviceRepository;
            _clinicRepository = clinicRepository;
            _vetClinicRepository = vetClinicRepository;
        }

        public async Task<System.Collections.Generic.List<AvailableSlotResponse>> Handle(
            GetAvailableSlotsQuery request, CancellationToken cancellationToken)
        {
            int durationMins = 30;
            if (request.ServiceId.HasValue)
            {
                var service = await _serviceRepository.GetByIdAsync(request.ServiceId.Value);
                if (service != null)
                    durationMins = service.DurationMins;
            }

            int bufferMins = await _clinicRepository.GetBufferMinsAsync(request.ClinicId);
            int totalSlotMins = durationMins + bufferMins;

            var dayOfWeek = (int)request.Date.DayOfWeek;

            var schedules = await _scheduleRepository.GetByClinicAndDayWithDoctorAsync(
                request.ClinicId, dayOfWeek, request.VetClinicId);

            if (!schedules.Any())
                return new System.Collections.Generic.List<AvailableSlotResponse>();

            var result = new System.Collections.Generic.List<AvailableSlotResponse>();

            foreach (var schedule in schedules)
            {
                var current = schedule.StartTime;
                while (current.AddMinutes(totalSlotMins) <= schedule.EndTime)
                {
                    var slotEnd = current.AddMinutes(totalSlotMins);
                    var conflictEnd = current.AddMinutes(durationMins);

                    var allVetClinicIds = await _vetClinicRepository.GetAllVetClinicIdsAsync(schedule.VetProfileId);

                    bool hasConflict = await _appointmentRepository.HasDoctorConflictAcrossClinicsAsync(
                        allVetClinicIds, request.Date, current, conflictEnd);

                    result.Add(new AvailableSlotResponse
                    {
                        VetClinicId = schedule.VetClinicId,
                        DoctorName = schedule.DoctorName,
                        StartTime = current,
                        EndTime = slotEnd,
                        IsAvailable = !hasConflict
                    });

                    current = slotEnd;
                }
            }

            return result
                .OrderBy(r => r.StartTime)
                .ThenBy(r => r.DoctorName)
                .ToList();
        }
    }
}
