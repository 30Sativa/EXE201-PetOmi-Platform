using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;
using PetOmiPlatform.Application.Features.Clinic.Mappers;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Clinic.Handler
{
    public class AddInventoryItemCommandHandler
        : IRequestHandler<AddInventoryItemCommand, InventoryItemResponse>
    {
        private readonly IClinicRepository _clinicRepo;
        private readonly IInventoryRepository _inventoryRepo;
        private readonly IUnitOfWork _uow;

        public AddInventoryItemCommandHandler(
            IClinicRepository clinicRepo,
            IInventoryRepository inventoryRepo,
            IUnitOfWork uow)
        {
            _clinicRepo = clinicRepo;
            _inventoryRepo = inventoryRepo;
            _uow = uow;
        }

        public async Task<InventoryItemResponse> Handle(
            AddInventoryItemCommand command, CancellationToken cancellationToken)
        {
            var clinic = await _clinicRepo.GetByOwnerUserIdAsync(command.UserId)
                ?? throw new NotFoundException("Không tìm thấy phòng khám.");
            if (clinic.Id != command.ClinicId)
                throw new ForbiddenException("Bạn không có quyền thao tác với phòng khám này.");
            clinic.EnsureApproved();

            var item = InventoryItemDomain.Create(
                clinicId: command.ClinicId,
                itemName: command.Request.ItemName,
                unit: command.Request.Unit,
                quantity: command.Request.Quantity,
                lowStockThreshold: command.Request.LowStockThreshold,
                unitPrice: command.Request.UnitPrice,
                expiryDate: command.Request.ExpiryDate,
                imageUrl: command.Request.ImageUrl,
                imageCloudinaryPublicId: command.Request.ImageCloudinaryPublicId
            );

            await _inventoryRepo.AddAsync(item);
            await _uow.SaveChangesAsync(cancellationToken);

            return item.ToResponse();
        }
    }
}
