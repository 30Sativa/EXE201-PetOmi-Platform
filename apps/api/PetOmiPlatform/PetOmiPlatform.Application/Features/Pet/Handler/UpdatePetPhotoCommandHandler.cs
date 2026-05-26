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
    public class UpdatePetPhotoCommandHandler : IRequestHandler<UpdatePetPhotoCommand, PetPhotoResponse>
    {
        private readonly IPetRepository _petRepository;
        private readonly IPetPhotoRepository _photoRepository;
        private readonly IPetUserAccessRepository _accessRepository;
        private readonly IPetAvatarService _avatarService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPetAccessService _accessService;

        public UpdatePetPhotoCommandHandler(
            IPetRepository petRepository,
            IPetPhotoRepository photoRepository,
            IPetUserAccessRepository accessRepository,
            IPetAvatarService avatarService,
            IUnitOfWork unitOfWork,
            IPetAccessService accessService)
        {
            _petRepository = petRepository;
            _photoRepository = photoRepository;
            _accessRepository = accessRepository;
            _avatarService = avatarService;
            _unitOfWork = unitOfWork;
            _accessService = accessService;
        }

        public async Task<PetPhotoResponse> Handle(UpdatePetPhotoCommand command, CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(command.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            await _accessService.EnsureCanWriteAsync(pet, command.UserId, cancellationToken);

            var photo = await _photoRepository.GetByIdAsync(command.PhotoId)
                ?? throw new NotFoundException("Không tìm thấy ảnh.");

            if (photo.PetId != command.PetId)
                throw new NotFoundException("Ảnh không thuộc về thú cưng này.");

            if (command.Request.Caption != null)
                photo.UpdateCaption(command.Request.Caption);

            if (command.Request.SetAsAvatar == true)
            {
                var currentAvatar = await _photoRepository.GetAvatarAsync(command.PetId);
                if (currentAvatar != null)
                {
                    currentAvatar.RemoveAvatar();
                    await _photoRepository.UpdateAsync(currentAvatar);
                }
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
    }
}
