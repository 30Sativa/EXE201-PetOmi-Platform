using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Clinic.Handler
{
    public class DeleteClinicServiceCommandHandler : IRequestHandler<DeleteClinicServiceCommand, Unit>
    {
        private readonly IClinicRepository _clinicRepository;
        private readonly IClinicServiceRepository _serviceRepository;
        private readonly IUnitOfWork _unitOfWork;

        public DeleteClinicServiceCommandHandler(
            IClinicRepository clinicRepository,
            IClinicServiceRepository serviceRepository,
            IUnitOfWork unitOfWork)
        {
            _clinicRepository = clinicRepository;
            _serviceRepository = serviceRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<Unit> Handle(DeleteClinicServiceCommand command, CancellationToken cancellationToken)
        {
            // 1. Validate ownership
            var myClinic = await _clinicRepository.GetByOwnerUserIdAsync(command.UserId)
                ?? throw new NotFoundException("Không tìm thấy phòng khám.");

            if (myClinic.Id != command.ClinicId)
                throw new ForbiddenException("Bạn không có quyền thao tác với phòng khám này.");

            // 2. Lấy service
            var service = await _serviceRepository.GetByIdAsync(command.ServiceId)
                ?? throw new NotFoundException("Không tìm thấy dịch vụ.");

            if (service.ClinicId != command.ClinicId)
                throw new ForbiddenException("Dịch vụ này không thuộc phòng khám của bạn.");

            // 3. Soft delete qua domain behavior
            service.Deactivate();

            // 4. Persist
            await _serviceRepository.UpdateAsync(service);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return Unit.Value;
        }
    }
}
