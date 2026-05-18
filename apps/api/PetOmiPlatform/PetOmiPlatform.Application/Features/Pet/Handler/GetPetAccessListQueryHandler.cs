using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using PetOmiPlatform.Application.Features.Pet.Query;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Pet.Handler
{
    public class GetPetAccessListQueryHandler : IRequestHandler<GetPetAccessListQuery, List<PetUserAccessResponse>>
    {
        private readonly IPetRepository _petRepository;
        private readonly IPetUserAccessRepository _accessRepository;

        public GetPetAccessListQueryHandler(
            IPetRepository petRepository,
            IPetUserAccessRepository accessRepository)
        {
            _petRepository = petRepository;
            _accessRepository = accessRepository;
        }

        public async Task<List<PetUserAccessResponse>> Handle(GetPetAccessListQuery query, CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(query.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            pet.EnsureOwner(query.UserId);

            var accesses = await _accessRepository.GetByPetIdAsync(query.PetId);

            return accesses.Select(a => new PetUserAccessResponse
            {
                PetUserAccessId = a.Id,
                PetId = a.PetId,
                UserId = a.UserId,
                AccessRole = a.AccessRole,
                GrantedByUserId = a.GrantedByUserId,
                ExpiresAt = a.ExpiresAt,
                IsExpired = a.IsExpired(),
                CreatedAt = a.CreatedAt
            }).ToList();
        }
    }
}
