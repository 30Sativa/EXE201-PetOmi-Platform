using MediatR;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Features.Clinic.Authorization;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;
using PetOmiPlatform.Application.Features.Clinic.Mappers;
using PetOmiPlatform.Domain.Interfaces.Repositories;

namespace PetOmiPlatform.Application.Features.Clinic.Handler
{
    public class GetInventoryQueryHandler
        : IRequestHandler<GetInventoryQuery, IEnumerable<InventoryItemResponse>>
    {
        private readonly IInventoryRepository _inventoryRepo;
        private readonly IVetClinicRepository _vetClinicRepository;

        public GetInventoryQueryHandler(
            IInventoryRepository inventoryRepo,
            IVetClinicRepository vetClinicRepository)
        {
            _inventoryRepo = inventoryRepo;
            _vetClinicRepository = vetClinicRepository;
        }

        public async Task<IEnumerable<InventoryItemResponse>> Handle(
            GetInventoryQuery request, CancellationToken cancellationToken)
        {
            var staff = await _vetClinicRepository.GetByUserIdAndClinicIdAsync(request.RequestUserId, request.ClinicId);
            ClinicRoleGuard.RequireActiveStaff(staff);

            var items = await _inventoryRepo.GetByClinicIdAsync(request.ClinicId, activeOnly: true);
            return items.Select(i => i.ToResponse());
        }
    }
}
