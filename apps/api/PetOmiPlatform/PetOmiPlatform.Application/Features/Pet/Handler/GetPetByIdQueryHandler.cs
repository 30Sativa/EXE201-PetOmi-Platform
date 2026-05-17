using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using PetOmiPlatform.Application.Features.Pet.Query;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Pet.Handler
{
    /// <summary>
    /// Handler lấy thông tin 1 pet theo ID.
    /// Chỉ chủ nuôi của pet mới được truy cập (có thể mở rộng family sharing sau).
    /// </summary>
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

            // 2. Kiểm tra quyền xem
            pet.EnsureOwner(query.UserId);

            return new PetResponse
            {
                PetId = pet.Id,
                OwnerUserId = pet.OwnerUserId,
                Name = pet.Name,
                Species = pet.Species,
                Breed = pet.Breed,
                Gender = pet.Gender,
                IsNeutered = pet.IsNeutered,
                DateOfBirth = pet.DateOfBirth,
                IsBirthDateEstimated = pet.IsBirthDateEstimated,
                AvatarUrl = pet.AvatarUrl,
                Color = pet.Color,
                CreatedAt = pet.CreatedAt,
                UpdatedAt = pet.UpdatedAt
            };
        }
    }
}
