using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Pet.Command;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Domain.Interfaces.Services;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Pet.Handler
{
    public class CreatePetCommandHandler : IRequestHandler<CreatePetCommand, PetResponse>
    {
        private readonly IPetRepository _petRepository;
        private readonly IPetPhotoRepository _petPhotoRepository;
        private readonly IPetHealthProfileRepository _petHealthProfileRepository;
        private readonly IUserRepository _userRepository;
        private readonly IPetCodeGenerator _petCodeGenerator;
        private readonly IUnitOfWork _unitOfWork;

        public CreatePetCommandHandler(
            IPetRepository petRepository,
            IPetPhotoRepository petPhotoRepository,
            IPetHealthProfileRepository petHealthProfileRepository,
            IUserRepository userRepository,
            IPetCodeGenerator petCodeGenerator,
            IUnitOfWork unitOfWork)
        {
            _petRepository = petRepository;
            _petPhotoRepository = petPhotoRepository;
            _petHealthProfileRepository = petHealthProfileRepository;
            _userRepository = userRepository;
            _petCodeGenerator = petCodeGenerator;
            _unitOfWork = unitOfWork;
        }

        public async Task<PetResponse> Handle(CreatePetCommand command, CancellationToken cancellationToken)
        {
            // 1. Kiểm tra user (chủ nuôi) có tồn tại không
            var user = await _userRepository.GetByIdAsync(command.UserId)
                ?? throw new NotFoundException("Người dùng không tồn tại.");

            // 2. Tạo hồ sơ pet mới — domain tự gán ID và CreatedAt
            var publicPetCode = await GenerateUniquePublicPetCodeAsync();

            var pet = PetDomain.Create(
                ownerUserId: command.UserId,
                publicPetCode: publicPetCode,
                name: command.Request.Name,
                species: command.Request.Species,
                breed: command.Request.Breed,
                gender: command.Request.Gender,
                dateOfBirth: command.Request.DateOfBirth,
                isBirthDateEstimated: command.Request.IsBirthDateEstimated,
                avatarUrl: command.Request.AvatarUrl,
                avatarCloudinaryPublicId: command.Request.AvatarCloudinaryPublicId
            );

            await _petRepository.AddAsync(pet);

            if (!string.IsNullOrWhiteSpace(command.Request.AvatarUrl))
            {
                var avatarPhoto = PetPhotoDomain.Create(
                    petId: pet.Id,
                    imageUrl: command.Request.AvatarUrl,
                    cloudinaryPublicId: command.Request.AvatarCloudinaryPublicId,
                    caption: "Avatar",
                    isAvatar: true,
                    takenAt: DateTime.UtcNow);

                await _petPhotoRepository.AddAsync(avatarPhoto);
            }

            if (!string.IsNullOrWhiteSpace(command.Request.Color)
                || !string.IsNullOrWhiteSpace(command.Request.IsNeutered))
            {
                var healthProfile = PetHealthProfileDomain.Create(
                    petId: pet.Id,
                    currentWeightKg: null,
                    color: command.Request.Color,
                    isNeutered: command.Request.IsNeutered,
                    allergies: null,
                    chronicConditions: null,
                    microchipNumber: null);

                await _petHealthProfileRepository.AddAsync(healthProfile);
            }

            // 3. Lưu vào DB
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // 4. Trả về response — mỗi handler tự quyết định shape của mình
            return new PetResponse
            {
                PetId = pet.Id,
                OwnerUserId = pet.OwnerUserId,
                PublicPetCode = pet.PublicPetCode,
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

        private async Task<string> GenerateUniquePublicPetCodeAsync()
        {
            for (var attempt = 0; attempt < 10; attempt++)
            {
                var code = _petCodeGenerator.GeneratePublicPetCode();
                if (!await _petRepository.PublicPetCodeExistsAsync(code))
                    return code;
            }

            throw new ConflictException("Khong the tao ma dinh danh thu cung. Vui long thu lai.");
        }
    }
}

