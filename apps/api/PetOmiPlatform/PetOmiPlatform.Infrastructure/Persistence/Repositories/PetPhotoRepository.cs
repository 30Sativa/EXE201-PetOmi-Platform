using Microsoft.EntityFrameworkCore;
using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using PetOmiPlatform.Infrastructure.Mappers;
using PetOmiPlatform.Infrastructure.Persistence.Contexts;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PetOmiPlatform.Infrastructure.Persistence.Repositories
{
    public class PetPhotoRepository : IPetPhotoRepository
    {
        private readonly PetOmniDbContext _context;

        public PetPhotoRepository(PetOmniDbContext context)
        {
            _context = context;
        }

        public async Task<PetPhotoDomain?> GetByIdAsync(Guid photoId)
        {
            var entity = await _context.PetPhotos
                .FirstOrDefaultAsync(p => p.PhotoId == photoId && p.IsActive);
            return entity?.ToDomain();
        }

        public async Task<PetPhotoDomain?> GetAvatarAsync(Guid petId)
        {
            var entity = await _context.PetPhotos
                .FirstOrDefaultAsync(p => p.PetId == petId && p.IsAvatar && p.IsActive);
            return entity?.ToDomain();
        }

        public async Task<List<PetPhotoDomain>> GetByPetIdAsync(Guid petId)
        {
            var entities = await _context.PetPhotos
                .Where(p => p.PetId == petId && p.IsActive)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
            return entities.Select(e => e.ToDomain()).ToList();
        }

        public async Task AddAsync(PetPhotoDomain photo)
        {
            await _context.PetPhotos.AddAsync(photo.ToEntity());
        }

        public async Task UpdateAsync(PetPhotoDomain photo)
        {
            var entity = await _context.PetPhotos.FindAsync(photo.Id);
            if (entity == null) return;

            var updated = photo.ToEntity();
            _context.Entry(entity).CurrentValues.SetValues(updated);
        }

        public async Task DeleteAsync(Guid photoId)
        {
            var entity = await _context.PetPhotos.FindAsync(photoId);
            if (entity != null)
            {
                entity.IsActive = false;
                entity.DeletedAt = DateTime.UtcNow;
            }
        }
    }
}
