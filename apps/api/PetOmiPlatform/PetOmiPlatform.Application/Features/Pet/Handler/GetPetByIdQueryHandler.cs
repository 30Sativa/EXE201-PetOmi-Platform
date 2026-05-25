using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using PetOmiPlatform.Application.Features.Pet.Query;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Pet.Handler
{
    public class GetPetByIdQueryHandler : IRequestHandler<GetPetByIdQuery, PetResponse>
    {
        private readonly IPetRepository _petRepository;
        private readonly IPetAccessService _accessService;

        public GetPetByIdQueryHandler(
            IPetRepository petRepository,
            IPetAccessService accessService)
        {
            _petRepository = petRepository;
            _accessService = accessService;
        }

        public async Task<PetResponse> Handle(GetPetByIdQuery query, CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(query.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            await _accessService.EnsureCanReadAsync(pet, query.UserId, cancellationToken);

            return new PetResponse
            {
                PetId = pet.Id,
                OwnerUserId = pet.OwnerUserId,
                Name = pet.Name,
                Species = pet.Species,
                Breed = pet.Breed,
                Gender = pet.Gender,
                DateOfBirth = pet.DateOfBirth,
                IsBirthDateEstimated = pet.IsBirthDateEstimated,
                AvatarUrl = pet.AvatarUrl,
                AvatarCloudinaryPublicId = pet.AvatarCloudinaryPublicId,
                CreatedAt = pet.CreatedAt,
                UpdatedAt = pet.UpdatedAt
            };
        }
    }
}
