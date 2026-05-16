using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using PetOmiPlatform.Application.Features.Pet.Query;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Pet.Handler
{
    // Handler lấy thông tin 1 pet theo ID
    public class GetPetByIdQueryHandler : IRequestHandler<GetPetByIdQuery, PetResponse>
    {
        private readonly IPetRepository _petRepository;

        public GetPetByIdQueryHandler(IPetRepository petRepository)
        {
            _petRepository = petRepository;
        }

        public async Task<PetResponse> Handle(GetPetByIdQuery query, CancellationToken cancellationToken)
        {
            // 1. Tìm pet theo ID
            var pet = await _petRepository.GetByIdAsync(query.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            // 2. Kiểm tra quyền xem — chỉ chủ nuôi được xem (có thể mở rộng cho family sharing sau)
            pet.EnsureOwner(query.UserId);

            return CreatePetCommandHandler.MapToResponse(pet);
        }
    }

    // Handler lấy danh sách pet của owner hiện tại
    public class GetMyPetsQueryHandler : IRequestHandler<GetMyPetsQuery, List<PetResponse>>
    {
        private readonly IPetRepository _petRepository;

        public GetMyPetsQueryHandler(IPetRepository petRepository)
        {
            _petRepository = petRepository;
        }

        public async Task<List<PetResponse>> Handle(GetMyPetsQuery query, CancellationToken cancellationToken)
        {
            // Lấy tất cả pet còn IsActive của owner — repository đã lọc sẵn
            var pets = await _petRepository.GetByOwnerIdAsync(query.UserId);

            return pets.Select(CreatePetCommandHandler.MapToResponse).ToList();
        }
    }
}
