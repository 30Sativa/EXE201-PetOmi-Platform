using MediatR;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using PetOmiPlatform.Application.Features.Pet.Query;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Pet.Handler
{
    /// <summary>
    /// Handler lấy danh sách tất cả pet còn IsActive của owner hiện tại.
    /// Repository đã lọc IsActive sẵn, handler không cần lọc thêm.
    /// </summary>
    public class GetMyPetsQueryHandler : IRequestHandler<GetMyPetsQuery, List<PetResponse>>
    {
        private readonly IPetRepository _petRepository;

        public GetMyPetsQueryHandler(IPetRepository petRepository)
        {
            _petRepository = petRepository;
        }

        public async Task<List<PetResponse>> Handle(GetMyPetsQuery query, CancellationToken cancellationToken)
        {
            var pets = await _petRepository.GetByOwnerIdAsync(query.UserId);

            return pets.Select(pet => new PetResponse
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
            }).ToList();
        }
    }
}
