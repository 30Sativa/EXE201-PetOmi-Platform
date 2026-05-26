using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Infrastructure.Services
{
    public class PetAvatarService : IPetAvatarService
    {
        private readonly PetOmniDbContext _context;
        private readonly IPetPhotoRepository _photoRepository;
        private readonly ICloudinaryService _cloudinaryService;

        public PetAvatarService(
            PetOmniDbContext context,
            IPetPhotoRepository photoRepository,
            ICloudinaryService cloudinaryService)
        {
            _context = context;
            _photoRepository = photoRepository;
            _cloudinaryService = cloudinaryService;
        }

        public async Task ReplaceAvatarAsync(
            Guid petId,
            string? newAvatarUrl,
            string? newCloudinaryPublicId,
            CancellationToken cancellationToken = default)
        {
            var currentAvatar = await _photoRepository.GetAvatarAsync(petId);
            if (currentAvatar == null) return;

            var oldPublicId = currentAvatar.CloudinaryPublicId;
            currentAvatar.RemoveAvatar();
            await _photoRepository.UpdateAsync(currentAvatar);

            if (!string.IsNullOrWhiteSpace(oldPublicId))
                await _cloudinaryService.DeleteAsync(oldPublicId, cancellationToken);

            if (!string.IsNullOrWhiteSpace(newAvatarUrl))
            {
                var petEntity = await _context.Pets.FirstOrDefaultAsync(p => p.PetId == petId && p.IsActive, cancellationToken);
                if (petEntity != null)
                {
                    petEntity.AvatarUrl = newAvatarUrl;
                    petEntity.AvatarCloudinaryPublicId = newCloudinaryPublicId;
                    petEntity.UpdatedAt = DateTime.UtcNow;
                }
            }
        }
    }
}
