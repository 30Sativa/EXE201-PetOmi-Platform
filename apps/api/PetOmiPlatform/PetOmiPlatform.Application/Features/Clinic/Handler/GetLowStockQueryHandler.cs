using MediatR;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
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
        private readonly IVetClinicRepository _vetClinicRepository;

        public GetLowStockQueryHandler(
            IInventoryRepository inventoryRepo,
            IVetClinicRepository vetClinicRepository)
        {
            _inventoryRepo = inventoryRepo;
            _vetClinicRepository = vetClinicRepository;
        }

        public async Task<IEnumerable<InventoryItemResponse>> Handle(
            GetLowStockQuery request, CancellationToken cancellationToken)
        {
            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(request.RequestUserId, request.ClinicId);
            ClinicRoleGuard.RequireActiveStaff(staff);

            var items = await _inventoryRepo.GetLowStockItemsAsync(request.ClinicId);
            return items.Select(i => i.ToResponse());
        }
    }
}
