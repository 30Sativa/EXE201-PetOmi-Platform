using MediatR;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Appointment.Command;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Response;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Appointment.Handler
{
    public class RescheduleAppointmentCommandHandler
        : IRequestHandler<RescheduleAppointmentCommand, AppointmentResponse>
    {
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IUnitOfWork _unitOfWork;

        public RescheduleAppointmentCommandHandler(
            IAppointmentRepository appointmentRepository,
            IUnitOfWork unitOfWork)
        {
            _appointmentRepository = appointmentRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<AppointmentResponse> Handle(
            RescheduleAppointmentCommand command, CancellationToken cancellationToken)
        {
            var appointment = await _appointmentRepository.GetByIdAsync(command.AppointmentId)
                ?? throw new NotFoundException("Appointment", command.AppointmentId);

            var req = command.Request;

            // Nếu có bác sĩ được assign, check conflict cho slot mới (bỏ qua chính appointment này)
            if (appointment.VetClinicId.HasValue)
            {
                var hasConflict = await _appointmentRepository.HasConflictAsync(
                    appointment.VetClinicId.Value,
                    req.NewDate,
                    req.NewStartTime,
                    req.NewEndTime,
                    excludeId: appointment.Id);

                if (hasConflict)
                    throw new ConflictException("Bác sĩ đã có lịch trong khung giờ này. Vui lòng chọn giờ khác.");
            }

            appointment.Reschedule(req.NewDate, req.NewStartTime, req.NewEndTime);

            await _appointmentRepository.UpdateAsync(appointment);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return AppointmentHandlerHelper.ToResponse(appointment);
        }
    }
}
