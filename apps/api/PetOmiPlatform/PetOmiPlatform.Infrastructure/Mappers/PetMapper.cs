using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;

namespace PetOmiPlatform.Infrastructure.Mappers
{
    public static class PetMapper
    {
        // Chuyển từ EF entity → Domain object (dùng trong repository khi đọc từ DB)
        public static PetDomain ToDomain(this Pet entity)
        {
            return PetDomain.Reconstitute(
                id: entity.PetId,
                ownerUserId: entity.OwnerUserId,
                name: entity.Name,
                species: entity.Species,
                breed: entity.Breed,
                gender: entity.Gender,
                isNeutered: entity.IsNeutered,
                dateOfBirth: entity.DateOfBirth,
                isBirthDateEstimated: entity.IsBirthDateEstimated,
                avatarUrl: entity.AvatarUrl,
                color: entity.Color,
                isActive: entity.IsActive,
                deletedAt: entity.DeletedAt,
                createdAt: entity.CreatedAt,
                updatedAt: entity.UpdatedAt
            );
        }

        // Chuyển từ Domain object → EF entity (dùng khi ghi vào DB)
        public static Pet ToEntity(this PetDomain domain)
        {
            return new Pet
            {
                PetId = domain.Id,
                OwnerUserId = domain.OwnerUserId,
                Name = domain.Name,
                Species = domain.Species,
                Breed = domain.Breed,
                Gender = domain.Gender,
                IsNeutered = domain.IsNeutered,
                DateOfBirth = domain.DateOfBirth,
                IsBirthDateEstimated = domain.IsBirthDateEstimated,
                AvatarUrl = domain.AvatarUrl,
                Color = domain.Color,
                IsActive = domain.IsActive,
                DeletedAt = domain.DeletedAt,
                CreatedAt = domain.CreatedAt,
                UpdatedAt = domain.UpdatedAt
            };
        }
    }
}
