using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Pet.Command;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Pet.Handler
{
    public class UpdatePetHealthProfileCommandHandler : IRequestHandler<UpdatePetHealthProfileCommand, PetHealthProfileResponse>
    {
        private readonly IPetRepository _petRepository;
        private readonly IPetHealthProfileRepository _healthProfileRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPetAccessService _accessService;

        public UpdatePetHealthProfileCommandHandler(
            IPetRepository petRepository,
            IPetHealthProfileRepository healthProfileRepository,
            IUnitOfWork unitOfWork,
            IPetAccessService accessService)
        {
            _petRepository = petRepository;
            _healthProfileRepository = healthProfileRepository;
            _unitOfWork = unitOfWork;
            _accessService = accessService;
        }

        public async Task<PetHealthProfileResponse> Handle(UpdatePetHealthProfileCommand command, CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(command.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            await _accessService.EnsureCanWriteAsync(pet, command.UserId, cancellationToken);

            var profile = await _healthProfileRepository.GetByPetIdAsync(command.PetId)
                ?? throw new NotFoundException("Hồ sơ sức khỏe chưa tồn tại.");

            profile.UpdateHealthInfo(
                currentWeightKg: command.Request.CurrentWeightKg,
                color: command.Request.Color,
                isNeutered: command.Request.IsNeutered,
                allergies: command.Request.Allergies,
                chronicConditions: command.Request.ChronicConditions,
                microchipNumber: command.Request.MicrochipNumber
            );

            await _healthProfileRepository.UpdateAsync(profile);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

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
