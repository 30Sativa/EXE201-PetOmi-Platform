using MediatR;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Appointment.Command;
using PetOmiPlatform.Application.Features.Appointment.DTOs.Response;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Appointment.Handler
{
    public class BookAppointmentCommandHandler
        : IRequestHandler<BookAppointmentCommand, AppointmentResponse>
    {
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IClinicRepository _clinicRepository;
        private readonly IClinicServiceRepository _serviceRepository;
        private readonly IUnitOfWork _unitOfWork;

        public BookAppointmentCommandHandler(
            IAppointmentRepository appointmentRepository,
            IClinicRepository clinicRepository,
            IClinicServiceRepository serviceRepository,
            IUnitOfWork unitOfWork)
        {
            _appointmentRepository = appointmentRepository;
            _clinicRepository = clinicRepository;
            _serviceRepository = serviceRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<AppointmentResponse> Handle(
            BookAppointmentCommand command, CancellationToken cancellationToken)
        {
            var req = command.Request;

            // 1. Validate clinic exists & approved
            var clinic = await _clinicRepository.GetByIdAsync(req.ClinicId)
                ?? throw new NotFoundException("Clinic", req.ClinicId);
            clinic.EnsureApproved();

            // 2. Tính EndTime dựa trên DurationMins của service (hoặc 30 phút mặc định)
            int durationMins = 30;
            if (req.ServiceId.HasValue)
            {
                var service = await _serviceRepository.GetByIdAsync(req.ServiceId.Value)
                    ?? throw new NotFoundException("ClinicService", req.ServiceId.Value);
                durationMins = service.DurationMins;
            }
            var endTime = req.StartTime.AddMinutes(durationMins);

            // 3. Parse appointment type
            if (!Enum.TryParse<AppointmentType>(req.AppointmentType, true, out var apptType))
                throw new ValidationException("AppointmentType", $"Loại lịch hẹn không hợp lệ: {req.AppointmentType}");

            // 4. Tạo domain (validate ngày không phải quá khứ)
            var appointment = AppointmentDomain.Book(
                clinicId: req.ClinicId,
                petId: req.PetId,
                bookedByUserId: command.OwnerUserId,
                appointmentDate: req.AppointmentDate,
                startTime: req.StartTime,
                endTime: endTime,
                appointmentType: apptType,
                serviceId: req.ServiceId,
                notes: req.Notes
            );

            // 5. Lưu
            await _appointmentRepository.AddAsync(appointment);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return AppointmentHandlerHelper.ToResponse(appointment);
        }
    }
}
