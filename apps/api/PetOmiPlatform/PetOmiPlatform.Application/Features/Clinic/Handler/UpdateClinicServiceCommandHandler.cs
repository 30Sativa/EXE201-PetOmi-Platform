using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Clinic.Handler
{
    public class UpdateClinicServiceCommandHandler : IRequestHandler<UpdateClinicServiceCommand, ClinicServiceResponse>
    {
        private readonly IClinicRepository _clinicRepository;
        private readonly IClinicServiceRepository _serviceRepository;
        private readonly IUnitOfWork _unitOfWork;

        public UpdateClinicServiceCommandHandler(
            IClinicRepository clinicRepository,
            IClinicServiceRepository serviceRepository,
            IUnitOfWork unitOfWork)
        {
            _clinicRepository = clinicRepository;
            _serviceRepository = serviceRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ClinicServiceResponse> Handle(UpdateClinicServiceCommand command, CancellationToken cancellationToken)
        {
            // 1. Validate ownership
            var myClinic = await _clinicRepository.GetByOwnerUserIdAsync(command.UserId)
                ?? throw new NotFoundException("Không tìm thấy phòng khám.");

            if (myClinic.Id != command.ClinicId)
                throw new ForbiddenException("Bạn không có quyền thao tác với phòng khám này.");

            // 2. Lấy service
            var service = await _serviceRepository.GetByIdAsync(command.ServiceId)
                ?? throw new NotFoundException("Không tìm thấy dịch vụ.");

            // Kiểm tra service thuộc clinic này
            if (service.ClinicId != command.ClinicId)
                throw new ForbiddenException("Dịch vụ này không thuộc phòng khám của bạn.");

            // 3. Domain behavior
            service.Update(
                serviceName: command.Request.ServiceName,
                description: command.Request.Description,
                price: command.Request.Price,
                durationMins: command.Request.DurationMins
            );

            // 4. Persist
            await _serviceRepository.UpdateAsync(service);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new ClinicServiceResponse
            {
                ServiceId = service.Id,
                ServiceName = service.ServiceName,
                Description = service.Description,
                Price = service.Price,
                DurationMins = service.DurationMins,
                IsActive = service.IsActive
            };
        }
    }
}
