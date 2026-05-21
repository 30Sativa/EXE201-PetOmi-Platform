using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Appointment.Command;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Response;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Appointment.Handler
{
    /// <summary>
    /// Tính slot trống của clinic trong 1 ngày.
    /// Logic: Lấy tất cả DoctorSchedule của các bác sĩ trong ngày đó (DayOfWeek),
    /// generate slots theo DurationMins, loại bỏ các slot đã có appointment Pending/Confirmed.
    /// </summary>
    public class GetAvailableSlotsQueryHandler
        : IRequestHandler<GetAvailableSlotsQuery, List<AvailableSlotResponse>>
    {
        private readonly IDoctorScheduleRepository _scheduleRepository;
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IClinicServiceRepository _serviceRepository;

        public GetAvailableSlotsQueryHandler(
            IDoctorScheduleRepository scheduleRepository,
            IAppointmentRepository appointmentRepository,
            IClinicServiceRepository serviceRepository)
        {
            _scheduleRepository = scheduleRepository;
            _appointmentRepository = appointmentRepository;
            _serviceRepository = serviceRepository;
        }

        public async Task<List<AvailableSlotResponse>> Handle(
            GetAvailableSlotsQuery request, CancellationToken cancellationToken)
        {
            // 1. Duration của slot
            int durationMins = 30;
            if (request.ServiceId.HasValue)
            {
                var service = await _serviceRepository.GetByIdAsync(request.ServiceId.Value);
                if (service != null)
                    durationMins = service.DurationMins;
            }

            // 2. Lịch làm việc của tất cả bác sĩ trong clinic hôm đó
            var dayOfWeek = (int)request.Date.DayOfWeek;
            var schedules = await _scheduleRepository.GetByClinicAndDayAsync(
                request.ClinicId, dayOfWeek);

            if (!schedules.Any())
                return new List<AvailableSlotResponse>();

            // 3. Generate tất cả slots từ schedule (gộp tất cả bác sĩ)
            var allSlots = new List<AvailableSlotResponse>();

            foreach (var schedule in schedules)
            {
                var current = schedule.StartTime;
                while (current.AddMinutes(durationMins) <= schedule.EndTime)
                {
                    var slotEnd = current.AddMinutes(durationMins);

                    // 4. Check có conflict với appointment nào không
                    var hasConflict = await _appointmentRepository.HasConflictAsync(
                        schedule.VetClinicId, request.Date, current, slotEnd);

                    allSlots.Add(new AvailableSlotResponse
                    {
                        StartTime = current,
                        EndTime = slotEnd,
                        IsAvailable = !hasConflict
                    });

                    current = slotEnd;
                }
            }

            // 5. Dedup và sort (nhiều bác sĩ có thể có cùng slot — lấy slot nếu có ít nhất 1 bác sĩ trống)
            return allSlots
                .GroupBy(s => s.StartTime)
                .Select(g => new AvailableSlotResponse
                {
                    StartTime = g.Key,
                    EndTime = g.First().EndTime,
                    IsAvailable = g.Any(s => s.IsAvailable)
                })
                .OrderBy(s => s.StartTime)
                .ToList();
        }
    }
}
