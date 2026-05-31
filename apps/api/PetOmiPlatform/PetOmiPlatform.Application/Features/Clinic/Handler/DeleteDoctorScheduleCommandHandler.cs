using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Application.Interfaces;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Clinic.Handler
{
    public class DeleteDoctorScheduleCommandHandler
        : IRequestHandler<DeleteDoctorScheduleCommand, Unit>
    {
        private readonly IClinicRepository _clinicRepo;
        private readonly IDoctorScheduleRepository _scheduleRepo;
        private readonly IVetClinicRepository _vetClinicRepo;
        private readonly IUnitOfWork _uow;

        public DeleteDoctorScheduleCommandHandler(
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

        public async Task<Unit> Handle(
            DeleteDoctorScheduleCommand command, CancellationToken cancellationToken)
        {
            var clinic = await _clinicRepo.GetByOwnerUserIdAsync(command.UserId)
                ?? throw new NotFoundException("Không tìm thấy phòng khám.");
            if (clinic.Id != command.ClinicId)
                throw new ForbiddenException("Bạn không có quyền thao tác với phòng khám này.");

            var schedule = await _scheduleRepo.GetByIdAsync(command.ScheduleId)
                ?? throw new NotFoundException("Không tìm thấy lịch làm việc.");

            var vetClinic = await _vetClinicRepo.GetByVetClinicIdAsync(schedule.VetClinicId);
            if (vetClinic == null || vetClinic.ClinicId != command.ClinicId)
                throw new ForbiddenException("Lich lam viec nay khong thuoc phong kham cua ban.");

            schedule.Deactivate();
            await _scheduleRepo.UpdateAsync(schedule);
            await _uow.SaveChangesAsync(cancellationToken);

            return Unit.Value;
        }
    }
}
