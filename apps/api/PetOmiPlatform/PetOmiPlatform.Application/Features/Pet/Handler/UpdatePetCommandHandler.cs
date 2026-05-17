using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Pet.Command;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Pet.Handler
{
    public class UpdatePetCommandHandler : IRequestHandler<UpdatePetCommand, PetResponse>
    {
        private readonly IPetRepository _petRepository;
        private readonly IUnitOfWork _unitOfWork;

        public UpdatePetCommandHandler(
            IPetRepository petRepository,
            IUnitOfWork unitOfWork)
        {
            _petRepository = petRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<PetResponse> Handle(UpdatePetCommand command, CancellationToken cancellationToken)
        {
            // 1. Tìm pet — nếu không tồn tại hoặc đã xóa mềm thì báo lỗi
            var pet = await _petRepository.GetByIdAsync(command.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            // 2. Kiểm tra quyền sở hữu — chỉ chủ nuôi của pet mới được cập nhật
            pet.EnsureOwner(command.UserId);

            // 3. Gọi behavior method trên domain để cập nhật (domain tự set UpdatedAt)
            pet.UpdateInfo(
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

            await _petRepository.UpdateAsync(pet);

            // 4. Lưu DB
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new PetResponse
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
}
