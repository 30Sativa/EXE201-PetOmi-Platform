using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Pet.Command;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Pet.Handler
{
    public class CreatePetPhotoCommandHandler : IRequestHandler<CreatePetPhotoCommand, PetPhotoResponse>
    {
        private readonly IPetRepository _petRepository;
        private readonly IPetPhotoRepository _photoRepository;
        private readonly IPetUserAccessRepository _accessRepository;
        private readonly IUnitOfWork _unitOfWork;

        public CreatePetPhotoCommandHandler(
            IPetRepository petRepository,
            IPetPhotoRepository photoRepository,
            IPetUserAccessRepository accessRepository,
            IUnitOfWork unitOfWork)
        {
            _petRepository = petRepository;
            _photoRepository = photoRepository;
            _accessRepository = accessRepository;
            _unitOfWork = unitOfWork;
        }

        public async Task<PetPhotoResponse> Handle(CreatePetPhotoCommand command, CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(command.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            await EnsureCanWrite(pet, command.UserId);

            var photo = PetPhotoDomain.Create(
                petId: command.PetId,
                imageUrl: command.Request.ImageUrl,
                caption: command.Request.Caption,
                isAvatar: command.Request.IsAvatar,
                takenAt: command.Request.TakenAt
            );

            if (command.Request.IsAvatar)
            {
                var currentAvatar = await _photoRepository.GetAvatarAsync(command.PetId);
                if (currentAvatar != null)
                {
                    currentAvatar.RemoveAvatar();
                    await _photoRepository.UpdateAsync(currentAvatar);
                }
            }

            await _photoRepository.AddAsync(photo);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new PetPhotoResponse
            {
                PhotoId = photo.Id,
                PetId = photo.PetId,
                ImageUrl = photo.ImageUrl,
                Caption = photo.Caption,
                IsAvatar = photo.IsAvatar,
                TakenAt = photo.TakenAt,
                CreatedAt = photo.CreatedAt
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
