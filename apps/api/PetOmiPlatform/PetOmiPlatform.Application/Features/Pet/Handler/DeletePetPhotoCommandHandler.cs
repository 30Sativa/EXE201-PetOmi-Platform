using MediatR;
using PetOmiPlatform.Application.Exceptions;
using PetOmiPlatform.Application.Features.Pet.Command;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Pet.Handler
{
    public class DeletePetPhotoCommandHandler : IRequestHandler<DeletePetPhotoCommand>
    {
        private readonly IPetRepository _petRepository;
        private readonly IPetPhotoRepository _photoRepository;
        private readonly ICloudinaryService _cloudinaryService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPetAccessService _accessService;

        public DeletePetPhotoCommandHandler(
            IPetRepository petRepository,
            IPetPhotoRepository photoRepository,
            ICloudinaryService cloudinaryService,
            IUnitOfWork unitOfWork,
            IPetAccessService accessService)
        {
            _petRepository = petRepository;
            _photoRepository = photoRepository;
            _cloudinaryService = cloudinaryService;
            _unitOfWork = unitOfWork;
            _accessService = accessService;
        }

        public async Task Handle(DeletePetPhotoCommand command, CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(command.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            await _accessService.EnsureCanWriteAsync(pet, command.UserId, cancellationToken);

            var photo = await _photoRepository.GetByIdAsync(command.PhotoId)
                ?? throw new NotFoundException("Không tìm thấy ảnh.");

            if (photo.PetId != command.PetId)
                throw new NotFoundException("Ảnh không thuộc về thú cưng này.");

            var publicId = photo.CloudinaryPublicId;

            await _photoRepository.DeleteAsync(command.PhotoId);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            if (!string.IsNullOrWhiteSpace(publicId))
            {
                await _cloudinaryService.DeleteAsync(publicId, cancellationToken);
            }
        }
    }
}
