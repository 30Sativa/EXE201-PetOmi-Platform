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
    public class GetPetHealthProfileQueryHandler : IRequestHandler<GetPetHealthProfileQuery, PetHealthProfileResponse>
    {
        private readonly IPetRepository _petRepository;
        private readonly IPetHealthProfileRepository _healthProfileRepository;
        private readonly IPetAccessService _accessService;

        public GetPetHealthProfileQueryHandler(
            IPetRepository petRepository,
            IPetHealthProfileRepository healthProfileRepository,
            IPetAccessService accessService)
        {
            _petRepository = petRepository;
            _healthProfileRepository = healthProfileRepository;
            _accessService = accessService;
        }

        public async Task<PetHealthProfileResponse> Handle(GetPetHealthProfileQuery query, CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(query.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            await _accessService.EnsureCanReadAsync(pet, query.UserId, cancellationToken);

            var profile = await _healthProfileRepository.GetByPetIdAsync(query.PetId)
                ?? throw new NotFoundException("Hồ sơ sức khỏe chưa được tạo.");

            return new PetHealthProfileResponse
            {
                PetHealthProfileId = profile.Id,
                PetId = profile.PetId,
                CurrentWeightKg = profile.CurrentWeightKg,
                Color = profile.Color,
                IsNeutered = profile.IsNeutered,
                Allergies = profile.Allergies,
                ChronicConditions = profile.ChronicConditions,
                MicrochipNumber = profile.MicrochipNumber,
                CreatedAt = profile.CreatedAt,
                UpdatedAt = profile.UpdatedAt
            };
        }
    }
}
