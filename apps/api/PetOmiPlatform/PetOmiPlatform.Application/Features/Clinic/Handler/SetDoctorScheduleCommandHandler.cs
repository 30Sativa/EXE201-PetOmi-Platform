using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Application.Interfaces;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Clinic.Handler
{
    public class SetDoctorScheduleCommandHandler
        : IRequestHandler<SetDoctorScheduleCommand, DoctorScheduleResponse>
    {
        private readonly IClinicRepository _clinicRepo;
        private readonly IDoctorScheduleRepository _scheduleRepo;
        private readonly IVetClinicRepository _vetClinicRepo;
        private readonly IUnitOfWork _uow;

        public SetDoctorScheduleCommandHandler(
            IClinicRepository clinicRepo,
            IDoctorScheduleRepository scheduleRepo,
            IVetClinicRepository vetClinicRepo,
            IUnitOfWork uow)
        {
            _clinicRepo = clinicRepo;
            _scheduleRepo = scheduleRepo;
            _vetClinicRepo = vetClinicRepo;
            _uow = uow;
        }

        public async Task<DoctorScheduleResponse> Handle(
            SetDoctorScheduleCommand command, CancellationToken cancellationToken)
        {
            var clinic = await _clinicRepo.GetByOwnerUserIdAsync(command.UserId)
                ?? throw new NotFoundException("Không tìm thấy phòng khám.");
            if (clinic.Id != command.ClinicId)
                throw new ForbiddenException("Bạn không có quyền thao tác với phòng khám này.");
            clinic.EnsureApproved();

            var vetClinic = await _vetClinicRepo.GetActiveByVetClinicIdAndClinicIdAsync(
                command.VetClinicId,
                command.ClinicId)
                ?? throw new ValidationException("VetClinicId", "Bac si khong thuoc clinic hoac da ngung hoat dong.");

            var existingSchedules = await _scheduleRepo.GetByVetClinicIdAsync(command.VetClinicId);
            var overlaps = existingSchedules.Any(x =>
                x.DayOfWeek == command.Request.DayOfWeek &&
                x.StartTime < command.Request.EndTime &&
                x.EndTime > command.Request.StartTime);
            if (overlaps)
                throw new ConflictException("Ca lam viec bi trung voi lich hien co cua bac si.");

            var schedule = DoctorScheduleDomain.Create(
                vetClinicId: command.VetClinicId,
                dayOfWeek: command.Request.DayOfWeek,
                startTime: command.Request.StartTime,
                endTime: command.Request.EndTime);

            await _scheduleRepo.AddAsync(schedule);
            await _uow.SaveChangesAsync(cancellationToken);

            return DoctorScheduleResponse.FromDomain(schedule);
        }
    }
}
