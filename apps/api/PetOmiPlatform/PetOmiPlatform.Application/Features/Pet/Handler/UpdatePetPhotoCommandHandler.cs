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
    public class UpdatePetPhotoCommandHandler : IRequestHandler<UpdatePetPhotoCommand, PetPhotoResponse>
    {
        private readonly IPetRepository _petRepository;
        private readonly IPetPhotoRepository _photoRepository;
<<<<<<< Updated upstream
        private readonly IPetUserAccessRepository _accessRepository;
=======
        private readonly IPetAvatarService _avatarService;
>>>>>>> Stashed changes
        private readonly IUnitOfWork _unitOfWork;

        public UpdatePetPhotoCommandHandler(
            IPetRepository petRepository,
            IPetPhotoRepository photoRepository,
<<<<<<< Updated upstream
            IPetUserAccessRepository accessRepository,
            IUnitOfWork unitOfWork)
        {
            _petRepository = petRepository;
            _photoRepository = photoRepository;
            _accessRepository = accessRepository;
=======
            IPetAvatarService avatarService,
            IUnitOfWork unitOfWork,
            IPetAccessService accessService)
        {
            _petRepository = petRepository;
            _photoRepository = photoRepository;
            _avatarService = avatarService;
>>>>>>> Stashed changes
            _unitOfWork = unitOfWork;
        }

        public async Task<PetPhotoResponse> Handle(UpdatePetPhotoCommand command, CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(command.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            await EnsureCanWrite(pet, command.UserId);

            var photo = await _photoRepository.GetByIdAsync(command.PhotoId)
                ?? throw new NotFoundException("Không tìm thấy ảnh.");

            if (photo.PetId != command.PetId)
                throw new NotFoundException("Ảnh không thuộc về thú cưng này.");

            if (command.Request.Caption != null)
                photo.UpdateCaption(command.Request.Caption);

            if (command.Request.SetAsAvatar == true)
            {
                await _avatarService.SetAvatarAsync(
                    command.PetId,
                    photo.ImageUrl,
                    photo.CloudinaryPublicId,
                    cancellationToken);
                photo.SetAsAvatar();
            }

            await _photoRepository.UpdateAsync(photo);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new PetPhotoResponse
            {
                PhotoId = photo.Id,
                PetId = photo.PetId,
                ImageUrl = photo.ImageUrl,
                CloudinaryPublicId = photo.CloudinaryPublicId,
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
