using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Infrastructure.Services
{
    public class PetAvatarService : IPetAvatarService
    {
        private readonly PetOmniDbContext _context;

        public PetAvatarService(PetOmniDbContext context)
        {
            _context = context;
        }

        public async Task ReplaceAvatarAsync(
            Guid petId,
            string? newAvatarUrl,
            string? newCloudinaryPublicId,
            Guid? selectedPhotoId = null,
            CancellationToken cancellationToken = default)
        {
            var currentAvatar = await _context.PetPhotos
                .FirstOrDefaultAsync(
                    p => p.PetId == petId
                        && p.IsAvatar
                        && p.IsActive
                        && (!selectedPhotoId.HasValue || p.PhotoId != selectedPhotoId.Value),
                    cancellationToken);

            if (currentAvatar != null)
            {
                currentAvatar.IsAvatar = false;
                currentAvatar.UpdatedAt = DateTime.UtcNow;
            }

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
