using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Infrastructure.Services
{
    public class PetAvatarService : IPetAvatarService
    {
        private readonly PetOmniDbContext _context;
        private readonly IPetPhotoRepository _photoRepository;

        public PetAvatarService(
            PetOmniDbContext context,
            IPetPhotoRepository photoRepository)
        {
            _context = context;
            _photoRepository = photoRepository;
        }

        public async Task<List<string>> SetAvatarAsync(
            Guid petId,
            string imageUrl,
            string? cloudinaryPublicId,
            CancellationToken cancellationToken = default)
        {
            var idsToDelete = new List<string>();

            var currentAvatar = await _photoRepository.GetAvatarAsync(petId);
            if (currentAvatar != null)
            {
                currentAvatar.RemoveAvatar();
                await _photoRepository.UpdateAsync(currentAvatar);
                if (!string.IsNullOrWhiteSpace(currentAvatar.CloudinaryPublicId))
                    idsToDelete.Add(currentAvatar.CloudinaryPublicId);
            }

            var petEntity = await _context.Pets.FirstOrDefaultAsync(p => p.PetId == petId && p.IsActive, cancellationToken);
            if (petEntity != null)
            {
                petEntity.AvatarUrl = imageUrl;
                petEntity.AvatarCloudinaryPublicId = cloudinaryPublicId;
                petEntity.UpdatedAt = DateTime.UtcNow;
            }

            return idsToDelete;
        }
    }
}
