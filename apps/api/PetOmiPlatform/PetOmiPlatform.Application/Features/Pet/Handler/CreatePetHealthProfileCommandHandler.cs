using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Pet.Command;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Exceptions;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Pet.Handler
{
    public class CreatePetHealthProfileCommandHandler : IRequestHandler<CreatePetHealthProfileCommand, PetHealthProfileResponse>
    {
        private readonly IPetRepository _petRepository;
        private readonly IPetHealthProfileRepository _healthProfileRepository;
        private readonly IPetUserAccessRepository _accessRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CreatePetHealthProfileCommandHandler(
            IPetRepository petRepository,
            IPetHealthProfileRepository healthProfileRepository,
            IPetUserAccessRepository accessRepository,
            IUnitOfWork unitOfWork)
        {
            _petRepository = petRepository;
            _healthProfileRepository = healthProfileRepository;
            _accessRepository = accessRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<PetHealthProfileResponse> Handle(CreatePetHealthProfileCommand command, CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(command.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            await EnsureCanWrite(pet, command.UserId);

            var existingProfile = await _healthProfileRepository.GetByPetIdAsync(command.PetId);
            if (existingProfile != null)
                throw new DomainException("Hồ sơ sức khỏe đã tồn tại. Vui lòng sử dụng endpoint cập nhật.");

            var profile = PetHealthProfileDomain.Create(
                petId: command.PetId,
                currentWeightKg: command.Request.CurrentWeightKg,
                color: command.Request.Color,
                isNeutered: command.Request.IsNeutered,
                allergies: command.Request.Allergies,
                chronicConditions: command.Request.ChronicConditions,
                microchipNumber: command.Request.MicrochipNumber
            );

            await _healthProfileRepository.AddAsync(profile);
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

        private async Task EnsureCanWrite(PetDomain pet, Guid userId)
        {
            if (pet.OwnerUserId == userId) return;
            var access = await _accessRepository.GetByPetAndUserAsync(pet.Id, userId);
            if (access == null || !access.CanWrite())
                throw new ForbiddenException("Bạn không có quyền thực hiện thao tác này.");
        }
    }
}
