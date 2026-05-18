using MediatR;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using PetOmiPlatform.Application.Features.Pet.Query;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Pet.Handler
{
    public class GetAccessiblePetsQueryHandler : IRequestHandler<GetAccessiblePetsQuery, List<PetResponse>>
    {
        private readonly IPetRepository _petRepository;
        private readonly IPetUserAccessRepository _accessRepository;

        public GetAccessiblePetsQueryHandler(
            IPetRepository petRepository,
            IPetUserAccessRepository accessRepository)
        {
            _petRepository = petRepository;
            _accessRepository = accessRepository;
        }

        public async Task<List<PetResponse>> Handle(GetAccessiblePetsQuery query, CancellationToken cancellationToken)
        {
            var ownedPets = await _petRepository.GetByOwnerIdAsync(query.UserId);

            var accesses = await _accessRepository.GetByUserIdAsync(query.UserId);
            var sharedPetIds = accesses
                .Where(a => a.CanRead())
                .Select(a => a.PetId)
                .Distinct();

            var sharedPets = new List<PetDomain>();
            foreach (var petId in sharedPetIds)
            {
                var pet = await _petRepository.GetByIdAsync(petId);
                if (pet != null)
                    sharedPets.Add(pet);
            }

            var allPets = ownedPets.Concat(sharedPets).DistinctBy(p => p.Id).ToList();

            return allPets.Select(p => new PetResponse
            {
                PetId = p.Id,
                OwnerUserId = p.OwnerUserId,
                Name = p.Name,
                Species = p.Species,
                Breed = p.Breed,
                Gender = p.Gender,
                DateOfBirth = p.DateOfBirth,
                IsBirthDateEstimated = p.IsBirthDateEstimated,
                AvatarUrl = p.AvatarUrl,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            }).ToList();
        }
    }
}
