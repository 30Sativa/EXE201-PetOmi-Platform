using MediatR;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Appointment.Command;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Response;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Appointment.Handler
{
    public class ConfirmAppointmentCommandHandler
        : IRequestHandler<ConfirmAppointmentCommand, AppointmentResponse>
    {
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IVetClinicRepository _vetClinicRepository;
        private readonly IUnitOfWork _unitOfWork;

        public ConfirmAppointmentCommandHandler(
            IAppointmentRepository appointmentRepository,
            IVetClinicRepository vetClinicRepository,
            IUnitOfWork unitOfWork)
        {
            _appointmentRepository = appointmentRepository;
            _vetClinicRepository = vetClinicRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<AppointmentResponse> Handle(
            ConfirmAppointmentCommand command, CancellationToken cancellationToken)
        {
            var appointment = await _appointmentRepository.GetByIdAsync(command.AppointmentId)
                ?? throw new NotFoundException("Appointment", command.AppointmentId);

            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(
                command.StaffUserId,
                appointment.ClinicId);
            ClinicRoleGuard.RequireActiveStaff(staff);

            appointment.Confirm(command.StaffUserId);

            await _appointmentRepository.UpdateAsync(appointment);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new AppointmentResponse
            {
                AppointmentId = appointment.Id,
                ClinicId = appointment.ClinicId,
                VetClinicId = appointment.VetClinicId,
                ServiceId = appointment.ServiceId,
                PetId = appointment.PetId,
                BookedByUserId = appointment.BookedByUserId,
                AppointmentDate = appointment.AppointmentDate,
                StartTime = appointment.StartTime,
                EndTime = appointment.EndTime,
                AppointmentType = appointment.AppointmentType.ToString(),
                Status = appointment.Status.ToString(),
                Notes = appointment.Notes,
                CancellationReason = appointment.CancellationReason,
                IsWalkIn = appointment.IsWalkIn,
                IsLateCancellation = appointment.IsLateCancellation,
                ConfirmedAt = appointment.ConfirmedAt,
                CancelledAt = appointment.CancelledAt,
                CreatedAt = appointment.CreatedAt
            };
        }
    }
}
