using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;

namespace PetOmiPlatform.Infrastructure.Mappers
{
    public static class PetPhotoMapper
    {
        public static PetPhotoDomain ToDomain(this PetPhoto entity)
        {
            return PetPhotoDomain.Reconstitute(
                id: entity.PhotoId,
                petId: entity.PetId,
                imageUrl: entity.ImageUrl,
                caption: entity.Caption,
                isAvatar: entity.IsAvatar,
                takenAt: entity.TakenAt,
                createdAt: entity.CreatedAt,
                deletedAt: entity.DeletedAt,
                isActive: entity.IsActive
            );
        }

        public static PetPhoto ToEntity(this PetPhotoDomain domain)
        {
            return new PetPhoto
            {
                PhotoId = domain.Id,
                PetId = domain.PetId,
                ImageUrl = domain.ImageUrl,
                Caption = domain.Caption,
                IsAvatar = domain.IsAvatar,
                TakenAt = domain.TakenAt,
                CreatedAt = domain.CreatedAt,
                DeletedAt = domain.DeletedAt,
                IsActive = domain.IsActive
            };
        }
    }
}
