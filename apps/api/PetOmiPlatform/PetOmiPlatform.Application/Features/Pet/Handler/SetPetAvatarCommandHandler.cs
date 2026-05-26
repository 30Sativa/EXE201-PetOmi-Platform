using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Pet.Command;
using PetOmiPlatform.Application.Features.Pet.DTOs.Request;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Pet.Handler
{
    public class SetPetAvatarCommandHandler : IRequestHandler<SetPetAvatarCommand, PetPhotoResponse>
    {
        private readonly IPetRepository _petRepository;
        private readonly IPetPhotoRepository _photoRepository;
        private readonly IPetAvatarService _avatarService;
        private readonly IPetAccessService _accessService;
        private readonly IUnitOfWork _unitOfWork;

        public SetPetAvatarCommandHandler(
            IPetRepository petRepository,
            IPetPhotoRepository photoRepository,
            IPetAvatarService avatarService,
            IPetAccessService accessService,
            IUnitOfWork unitOfWork)
        {
            _petRepository = petRepository;
            _photoRepository = photoRepository;
            _avatarService = avatarService;
            _accessService = accessService;
            _unitOfWork = unitOfWork;
        }

        public async Task<PetPhotoResponse> Handle(SetPetAvatarCommand command, CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(command.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            await _accessService.EnsureCanWriteAsync(pet, command.UserId, cancellationToken);

            var photo = await _photoRepository.GetByIdAsync(command.Request.PhotoId)
                ?? throw new NotFoundException("Không tìm thấy ảnh.");

            if (photo.PetId != command.PetId)
                throw new NotFoundException("Ảnh không thuộc về thú cưng này.");

            var currentAvatar = await _photoRepository.GetAvatarAsync(command.PetId);
            if (currentAvatar != null)
            {
                currentAvatar.RemoveAvatar();
                await _photoRepository.UpdateAsync(currentAvatar);
            }

            photo.SetAsAvatar();
            await _photoRepository.UpdateAsync(photo);

            await _avatarService.ReplaceAvatarAsync(
                command.PetId,
                photo.ImageUrl,
                photo.CloudinaryPublicId,
                cancellationToken);

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
