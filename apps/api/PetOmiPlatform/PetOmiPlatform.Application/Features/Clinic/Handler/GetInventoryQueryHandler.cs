using MediatR;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;
using PetOmiPlatform.Application.Features.Clinic.Mappers;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Clinic.Handler
{
    public class GetInventoryQueryHandler
        : IRequestHandler<GetInventoryQuery, IEnumerable<InventoryItemResponse>>
    {
        private readonly IInventoryRepository _inventoryRepo;

        public GetInventoryQueryHandler(IInventoryRepository inventoryRepo)
            => _inventoryRepo = inventoryRepo;

        public async Task<IEnumerable<InventoryItemResponse>> Handle(
            GetInventoryQuery request, CancellationToken cancellationToken)
        {
            var items = await _inventoryRepo.GetByClinicIdAsync(request.ClinicId, activeOnly: true);
            return items.Select(i => i.ToResponse());
        }
    }
}
