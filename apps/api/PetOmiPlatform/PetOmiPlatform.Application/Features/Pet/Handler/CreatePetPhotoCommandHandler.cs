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
    public class CreatePetPhotoCommandHandler : IRequestHandler<CreatePetPhotoCommand, PetPhotoResponse>
    {
        private readonly IPetRepository _petRepository;
        private readonly IPetPhotoRepository _photoRepository;

        private readonly ICloudinaryService _cloudinaryService;

        private readonly IPetUserAccessRepository _accessRepository;

        private readonly IPetAvatarService _avatarService;
        private readonly ICloudinaryService _cloudinaryService;

        private readonly ICloudinaryService _cloudinaryService;

        private readonly IUnitOfWork _unitOfWork;
        private readonly IPetAccessService _accessService;

        public CreatePetPhotoCommandHandler(
            IPetRepository petRepository,
            IPetPhotoRepository photoRepository,

            IPetUserAccessRepository accessRepository,
            IUnitOfWork unitOfWork)
        {
            _petRepository = petRepository;
            _photoRepository = photoRepository;
            _accessRepository = accessRepository;

            IPetAvatarService avatarService,

            ICloudinaryService cloudinaryService,
            IUnitOfWork unitOfWork,
            IPetAccessService accessService)
        {
            _petRepository = petRepository;
            _photoRepository = photoRepository;
            _cloudinaryService = cloudinaryService;

            ICloudinaryService cloudinaryService,
            IUnitOfWork unitOfWork,
            IPetAccessService accessService)
        {
            _petRepository = petRepository;
            _photoRepository = photoRepository;
            _cloudinaryService = cloudinaryService;

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

        public async Task<PetPhotoResponse> Handle(CreatePetPhotoCommand command, CancellationToken cancellationToken)
        {
            var pet = await _petRepository.GetByIdAsync(command.PetId)
                ?? throw new NotFoundException("Không tìm thấy hồ sơ thú cưng.");

            await _accessService.EnsureCanWriteAsync(pet, command.UserId, cancellationToken);


            var oldPublicIdsToDelete = await HandleAvatarReplacement(command.PetId, command.Request.IsAvatar, cancellationToken);

            var photo = Domain.Entities.PetPhotoDomain.Create(

            var photo = PetPhotoDomain.Create(

            if (command.Request.IsAvatar)
            {
                var idsToDelete = await _avatarService.SetAvatarAsync(
                    command.PetId,
                    command.Request.ImageUrl,
                    command.Request.CloudinaryPublicId,
                    cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);
                await DeleteOldCloudinaryFiles(idsToDelete, cancellationToken);
            }

            var photo = Domain.Entities.PetPhotoDomain.Create(

            var oldPublicIdsToDelete = await HandleAvatarReplacement(command.PetId, command.Request.IsAvatar, cancellationToken);

            var photo = Domain.Entities.PetPhotoDomain.Create(

            var oldPublicIdsToDelete = await HandleAvatarReplacement(command.PetId, command.Request.IsAvatar, cancellationToken);

            var photo = Domain.Entities.PetPhotoDomain.Create(

                petId: command.PetId,
                imageUrl: command.Request.ImageUrl,
                cloudinaryPublicId: command.Request.CloudinaryPublicId,
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

            if (oldPublicIdsToDelete.Count > 0)
            {
                foreach (var publicId in oldPublicIdsToDelete)
                {
                    await _cloudinaryService.DeleteAsync(publicId, cancellationToken);
                }
            }

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


        private async Task<List<string>> HandleAvatarReplacement(Guid petId, bool isAvatar, CancellationToken cancellationToken)
        {

        private async Task EnsureCanWrite(PetDomain pet, Guid userId)
        {
            if (pet.OwnerUserId == userId) return;
            var access = await _accessRepository.GetByPetAndUserAsync(pet.Id, userId);
            if (access == null || !access.CanWrite())
                throw new ForbiddenException("Bạn không có quyền thực hiện thao tác này.");

        private async Task DeleteOldCloudinaryFiles(List<string> publicIds, CancellationToken cancellationToken)
        {
            foreach (var publicId in publicIds)
            {
                await _cloudinaryService.DeleteAsync(publicId, cancellationToken);
            }

        private async Task<List<string>> HandleAvatarReplacement(Guid petId, bool isAvatar, CancellationToken cancellationToken)
        {

        private async Task<List<string>> HandleAvatarReplacement(Guid petId, bool isAvatar, CancellationToken cancellationToken)
        {

            if (!isAvatar) return new List<string>();

            var currentAvatar = await _photoRepository.GetAvatarAsync(petId);
            if (currentAvatar == null) return new List<string>();

            currentAvatar.RemoveAvatar();
            await _photoRepository.UpdateAsync(currentAvatar);

            var ids = new List<string>();
            if (!string.IsNullOrWhiteSpace(currentAvatar.CloudinaryPublicId))
                ids.Add(currentAvatar.CloudinaryPublicId);
            return ids;

        }
    }
}
