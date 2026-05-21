using MediatR;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;
using PetOmiPlatform.Application.Features.Clinic.Mappers;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Clinic.Handler
{
    public class GetLowStockQueryHandler
        : IRequestHandler<GetLowStockQuery, IEnumerable<InventoryItemResponse>>
    {
        private readonly IInventoryRepository _inventoryRepo;

        public GetLowStockQueryHandler(IInventoryRepository inventoryRepo)
            => _inventoryRepo = inventoryRepo;

        public async Task<IEnumerable<InventoryItemResponse>> Handle(
            GetLowStockQuery request, CancellationToken cancellationToken)
        {
            var items = await _inventoryRepo.GetLowStockItemsAsync(request.ClinicId);
            return items.Select(i => i.ToResponse());
        }
    }
}
