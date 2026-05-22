using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Appointment.CheckIn.Command;
using PetOmiPlatform.Application.Features.Appointment.CheckIn.DTOs.Response;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Application.Interfaces;

namespace PetOmiPlatform.Application.Features.Appointment.CheckIn.Handler
{
    public class CheckInCommandHandler : IRequestHandler<CheckInCommand, CheckInResponse>
    {
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CheckInCommandHandler(
            IAppointmentRepository appointmentRepository,
            IUnitOfWork unitOfWork)
        {
            _appointmentRepository = appointmentRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<CheckInResponse> Handle(CheckInCommand request, CancellationToken cancellationToken)
        {
            var appointment = await _appointmentRepository.GetByIdAsync(request.AppointmentId);
            
            if (appointment == null)
                throw new NotFoundException($"Không tìm thấy lịch hẹn với ID {request.AppointmentId}");

            if (appointment.ClinicId != request.ClinicId)
                throw new ForbiddenException("Bạn không có quyền thao tác trên lịch hẹn này.");

            appointment.CheckIn(request.StaffUserId);

            await _appointmentRepository.UpdateAsync(appointment);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new CheckInResponse
            {
                AppointmentId = appointment.Id,
                Status = appointment.Status.ToString(),
                CheckedInAt = appointment.CheckedInAt,
                CheckedInByUserId = appointment.CheckedInByUserId
            };
        }
    }
}
