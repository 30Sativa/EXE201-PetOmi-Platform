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
    public class CreatePetCommandHandler : IRequestHandler<CreatePetCommand, PetResponse>
    {
        private readonly IPetRepository _petRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CreatePetCommandHandler(
            IPetRepository petRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork)
        {
            _petRepository = petRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<PetResponse> Handle(CreatePetCommand command, CancellationToken cancellationToken)
        {
            // 1. Kiểm tra user (chủ nuôi) có tồn tại không
            var user = await _userRepository.GetByIdAsync(command.UserId)
                ?? throw new NotFoundException("Người dùng không tồn tại.");

            // 2. Tạo hồ sơ pet mới — domain tự gán ID và CreatedAt
            var pet = PetDomain.Create(
                ownerUserId: command.UserId,
                name: command.Request.Name,
                species: command.Request.Species,
                breed: command.Request.Breed,
                gender: command.Request.Gender,
                isNeutered: command.Request.IsNeutered,
                dateOfBirth: command.Request.DateOfBirth,
                isBirthDateEstimated: command.Request.IsBirthDateEstimated,
                avatarUrl: command.Request.AvatarUrl,
                color: command.Request.Color
            );

            await _petRepository.AddAsync(pet);

            // 3. Lưu vào DB
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // 4. Trả về response
            return MapToResponse(pet);
        }

        // Map domain → response DTO (dùng chung trong các handler của Pet)
        internal static PetResponse MapToResponse(PetDomain pet) => new()
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
        };
    }
}
