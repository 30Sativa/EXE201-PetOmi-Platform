using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using PetOmiPlatform.Application.Features.Pet.Query;
using PetOmiPlatform.Domain.Entities;
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
        private readonly IPetUserAccessRepository _accessRepository;

        public GetPetHealthProfileQueryHandler(
            IPetRepository petRepository,
            IPetHealthProfileRepository healthProfileRepository,
            IPetUserAccessRepository accessRepository)
        {
            _petRepository = petRepository;
            _healthProfileRepository = healthProfileRepository;
            _accessRepository = accessRepository;
        }

        public async Task<PetHealthProfileResponse> Handle(GetPetHealthProfileQuery query, CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(query.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            await EnsureCanRead(pet, query.UserId);

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

        private async Task EnsureCanRead(PetDomain pet, Guid userId)
        {
            if (pet.OwnerUserId == userId) return;
            var access = await _accessRepository.GetByPetAndUserAsync(pet.Id, userId);
            if (access == null || !access.CanRead())
                throw new ForbiddenException("Bạn không có quyền xem thông tin này.");
        }
    }
}
