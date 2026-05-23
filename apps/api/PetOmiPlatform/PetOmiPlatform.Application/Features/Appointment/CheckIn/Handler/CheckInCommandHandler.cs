using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Appointment.CheckIn.Command;
using PetOmiPlatform.Application.Features.Appointment.CheckIn.DTOs.Response;
using PetOmiPlatform.Application.Features.Appointment.CheckIn.Mappers;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Application.Interfaces;

namespace PetOmiPlatform.Application.Features.Appointment.CheckIn.Handler
{
    public class CheckInCommandHandler : IRequestHandler<CheckInCommand, CheckInResponse>
    {
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CheckInCommandHandler(
            IAppointmentRepository appointmentRepository,
            IVetClinicRepository vetClinicRepository,
            IUnitOfWork unitOfWork)
        {
            _appointmentRepository = appointmentRepository;
            _vetClinicRepository = vetClinicRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<CheckInResponse> Handle(CheckInCommand request, CancellationToken cancellationToken)
        {
            var appointment = await _appointmentRepository.GetByIdAsync(request.AppointmentId);
            
            if (appointment == null)
                throw new NotFoundException($"Không tìm thấy lịch hẹn với ID {request.AppointmentId}");

            if (appointment.ClinicId != request.ClinicId)
                throw new ForbiddenException("Bạn không có quyền thao tác trên lịch hẹn này.");

            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(request.StaffUserId, request.ClinicId);
            ClinicRoleGuard.RequireActiveStaff(staff);

            appointment.CheckIn(request.StaffUserId);

            await _appointmentRepository.UpdateAsync(appointment);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return appointment.ToCheckInResponse();
        }
    }
}
