using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Clinic.Handler
{
    public class AddClinicServiceCommandHandler : IRequestHandler<AddClinicServiceCommand, ClinicServiceResponse>
    {
        private readonly IClinicRepository _clinicRepository;
        private readonly IClinicServiceRepository _serviceRepository;
        private readonly IUnitOfWork _unitOfWork;

        public AddClinicServiceCommandHandler(
            IClinicRepository clinicRepository,
            IClinicServiceRepository serviceRepository,
            IUnitOfWork unitOfWork)
        {
            _clinicRepository = clinicRepository;
            _serviceRepository = serviceRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<ClinicServiceResponse> Handle(AddClinicServiceCommand command, CancellationToken cancellationToken)
        {
            // 1. Kiểm tra user là owner của clinic này
            var myClinic = await _clinicRepository.GetByOwnerUserIdAsync(command.UserId)
                ?? throw new NotFoundException("Không tìm thấy phòng khám.");

            if (myClinic.Id != command.ClinicId)
                throw new ForbiddenException("Bạn không có quyền thao tác với phòng khám này.");

            // Clinic phải Approved mới được thêm dịch vụ
            myClinic.EnsureApproved();

            // 2. Tạo service domain — validate bên trong domain
            var service = ClinicServiceDomain.Create(
                clinicId: command.ClinicId,
                serviceName: command.Request.ServiceName,
                description: command.Request.Description,
                price: command.Request.Price,
                durationMins: command.Request.DurationMins
            );

            // 3. Persist
            await _serviceRepository.AddAsync(service);
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
