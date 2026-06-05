using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Pet.Command;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Pet.Handler
{
    public class UpdatePetCommandHandler : IRequestHandler<UpdatePetCommand, PetResponse>
    {
        private readonly IPetRepository _petRepository;
        private readonly IPetHealthProfileRepository _petHealthProfileRepository;
        private readonly ICloudinaryService _cloudinaryService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPetAccessService _accessService;

        public UpdatePetCommandHandler(
            IPetRepository petRepository,
            IPetHealthProfileRepository petHealthProfileRepository,
            ICloudinaryService cloudinaryService,
            IUnitOfWork unitOfWork,
            IPetAccessService accessService)
        {
            _petRepository = petRepository;
            _petHealthProfileRepository = petHealthProfileRepository;
            _cloudinaryService = cloudinaryService;
            _unitOfWork = unitOfWork;
            _accessService = accessService;
        }

        public async Task<PetResponse> Handle(UpdatePetCommand command, CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(command.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            await _accessService.EnsureCanWriteAsync(pet, command.UserId, cancellationToken);

            string? oldAvatarPublicId = null;
            bool hasNewAvatar = command.Request.AvatarUrl != null
                && command.Request.AvatarUrl != pet.AvatarUrl;

            if (hasNewAvatar && !string.IsNullOrWhiteSpace(pet.AvatarCloudinaryPublicId))
            {
                oldAvatarPublicId = pet.AvatarCloudinaryPublicId;
            }

            pet.UpdateInfo(
                name: command.Request.Name,
                species: command.Request.Species,
                breed: command.Request.Breed,
                gender: command.Request.Gender,
                dateOfBirth: command.Request.DateOfBirth,
                isBirthDateEstimated: command.Request.IsBirthDateEstimated,
                avatarUrl: command.Request.AvatarUrl,
                avatarCloudinaryPublicId: command.Request.AvatarCloudinaryPublicId
            );

            await _petRepository.UpdateAsync(pet);

            if (!string.IsNullOrWhiteSpace(command.Request.Color)
                || !string.IsNullOrWhiteSpace(command.Request.IsNeutered))
            {
                var healthProfile = await _petHealthProfileRepository.GetByPetIdAsync(command.PetId);
                if (healthProfile == null)
                {
                    healthProfile = PetHealthProfileDomain.Create(
                        petId: command.PetId,
                        currentWeightKg: null,
                        color: command.Request.Color,
                        isNeutered: command.Request.IsNeutered,
                        allergies: null,
                        chronicConditions: null,
                        microchipNumber: null);

                    await _petHealthProfileRepository.AddAsync(healthProfile);
                }
                else
                {
                    healthProfile.UpdateHealthInfo(
                        currentWeightKg: null,
                        color: command.Request.Color,
                        isNeutered: command.Request.IsNeutered,
                        allergies: null,
                        chronicConditions: null,
                        microchipNumber: null);

                    await _petHealthProfileRepository.UpdateAsync(healthProfile);
                }
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            if (!string.IsNullOrWhiteSpace(oldAvatarPublicId))
            {
                await _cloudinaryService.DeleteAsync(oldAvatarPublicId, cancellationToken);
            }

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
