using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Clinic.Handler
{
    // ── Helper ──────────────────────────────────────────────────────
    file static class ScheduleHelper
    {
        private static readonly string[] DayNames = { "Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7" };

        public static DoctorScheduleResponse ToResponse(DoctorScheduleDomain s) => new()
        {
            ScheduleId = s.Id,
            VetClinicId = s.VetClinicId,
            DayOfWeek = s.DayOfWeek,
            DayName = DayNames[s.DayOfWeek],
            StartTime = s.StartTime,
            EndTime = s.EndTime,
            IsActive = s.IsActive
        };
    }

    // ── SetDoctorScheduleCommandHandler ─────────────────────────────
    public class SetDoctorScheduleCommandHandler
        : IRequestHandler<SetDoctorScheduleCommand, DoctorScheduleResponse>
    {
        private readonly IClinicRepository _clinicRepo;
        private readonly IDoctorScheduleRepository _scheduleRepo;
        private readonly IUnitOfWork _uow;

        public SetDoctorScheduleCommandHandler(
            IClinicRepository clinicRepo,
            IDoctorScheduleRepository scheduleRepo,
            IUnitOfWork uow)
        {
            _clinicRepo = clinicRepo;
            _scheduleRepo = scheduleRepo;
            _uow = uow;
        }

        public async Task<DoctorScheduleResponse> Handle(
            SetDoctorScheduleCommand command, CancellationToken cancellationToken)
        {
            // 1. Validate owner
            var clinic = await _clinicRepo.GetByOwnerUserIdAsync(command.UserId)
                ?? throw new NotFoundException("Không tìm thấy phòng khám.");
            if (clinic.Id != command.ClinicId)
                throw new ForbiddenException("Bạn không có quyền thao tác với phòng khám này.");
            clinic.EnsureApproved();

            // 2. Tạo lịch
            var schedule = DoctorScheduleDomain.Create(
                vetClinicId: command.VetClinicId,
                dayOfWeek: command.Request.DayOfWeek,
                startTime: command.Request.StartTime,
                endTime: command.Request.EndTime
            );

            await _scheduleRepo.AddAsync(schedule);
            await _uow.SaveChangesAsync(cancellationToken);

            return ScheduleHelper.ToResponse(schedule);
        }
    }

    // ── DeleteDoctorScheduleCommandHandler ──────────────────────────
    public class DeleteDoctorScheduleCommandHandler
        : IRequestHandler<DeleteDoctorScheduleCommand, Unit>
    {
        private readonly IClinicRepository _clinicRepo;
        private readonly IDoctorScheduleRepository _scheduleRepo;
        private readonly IUnitOfWork _uow;

        public DeleteDoctorScheduleCommandHandler(
            IClinicRepository clinicRepo,
            IDoctorScheduleRepository scheduleRepo,
            IUnitOfWork uow)
        {
            _clinicRepo = clinicRepo;
            _scheduleRepo = scheduleRepo;
            _uow = uow;
        }

        public async Task<Unit> Handle(
            DeleteDoctorScheduleCommand command, CancellationToken cancellationToken)
        {
            var clinic = await _clinicRepo.GetByOwnerUserIdAsync(command.UserId)
                ?? throw new NotFoundException("Không tìm thấy phòng khám.");
            if (clinic.Id != command.ClinicId)
                throw new ForbiddenException("Bạn không có quyền thao tác với phòng khám này.");

            var schedule = await _scheduleRepo.GetByIdAsync(command.ScheduleId)
                ?? throw new NotFoundException("Không tìm thấy lịch làm việc.");

            schedule.Deactivate();
            await _scheduleRepo.UpdateAsync(schedule);
            await _uow.SaveChangesAsync(cancellationToken);

            return Unit.Value;
        }
    }

    // ── GetDoctorSchedulesQueryHandler ──────────────────────────────
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
            return schedules.Select(ScheduleHelper.ToResponse);
        }
    }
}
