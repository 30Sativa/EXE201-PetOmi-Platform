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
    public class CreatePetPhotoCommandHandler : IRequestHandler<CreatePetPhotoCommand, PetPhotoResponse>
    {
        private readonly IPetRepository _petRepository;
        private readonly IPetPhotoRepository _photoRepository;
        private readonly IPetAvatarService _avatarService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPetAccessService _accessService;

        public CreatePetPhotoCommandHandler(
            IPetRepository petRepository,
            IPetPhotoRepository photoRepository,
            IPetAvatarService avatarService,
            IUnitOfWork unitOfWork,
            IPetAccessService accessService)
        {
            _petRepository = petRepository;
            _photoRepository = photoRepository;
            _avatarService = avatarService;
            _unitOfWork = unitOfWork;
            _accessService = accessService;
        }

        public async Task<PetPhotoResponse> Handle(CreatePetPhotoCommand command, CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(command.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            await _accessService.EnsureCanWriteAsync(pet, command.UserId, cancellationToken);

            var photo = Domain.Entities.PetPhotoDomain.Create(
                petId: command.PetId,
                imageUrl: command.Request.ImageUrl,
                cloudinaryPublicId: command.Request.CloudinaryPublicId,
                caption: command.Request.Caption,
                isAvatar: command.Request.IsAvatar,
                takenAt: command.Request.TakenAt
            );

            await _photoRepository.AddAsync(photo);

            if (command.Request.IsAvatar)
            {
                await _avatarService.ReplaceAvatarAsync(
                    command.PetId,
                    command.Request.ImageUrl,
                    command.Request.CloudinaryPublicId,
                    cancellationToken);
            }

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
