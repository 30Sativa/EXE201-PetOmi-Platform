using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Clinic.Handler
{
    public class DeleteInventoryItemCommandHandler : IRequestHandler<DeleteInventoryItemCommand, Unit>
    {
        private readonly IClinicRepository _clinicRepo;
        private readonly IInventoryRepository _inventoryRepo;
        private readonly IUnitOfWork _uow;

        public DeleteInventoryItemCommandHandler(
            IClinicRepository clinicRepo,
            IInventoryRepository inventoryRepo,
            IUnitOfWork uow)
        {
            _clinicRepo = clinicRepo;
            _inventoryRepo = inventoryRepo;
            _uow = uow;
        }

        public async Task<Unit> Handle(
            DeleteInventoryItemCommand command, CancellationToken cancellationToken)
        {
            var clinic = await _clinicRepo.GetByOwnerUserIdAsync(command.UserId)
                ?? throw new NotFoundException("Không tìm thấy phòng khám.");
            if (clinic.Id != command.ClinicId)
                throw new ForbiddenException("Bạn không có quyền thao tác với phòng khám này.");

            var item = await _inventoryRepo.GetByIdAsync(command.ItemId)
                ?? throw new NotFoundException("Không tìm thấy mặt hàng.");
            if (item.ClinicId != command.ClinicId)
                throw new ForbiddenException("Mặt hàng này không thuộc phòng khám của bạn.");

            item.Deactivate();
            await _inventoryRepo.UpdateAsync(item);
            await _uow.SaveChangesAsync(cancellationToken);

            return Unit.Value;
        }
    }
}
