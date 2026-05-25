using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;
using System;

namespace PetOmiPlatform.Infrastructure.Mappers
{
    public static class UserProfileMapper
    {
        public static UserProfileDomain ToDomain(this UserProfile entity)
        {
            return UserProfileDomain.Reconstitute(
                id: entity.ProfileId,
                userId: entity.UserId,
                fullName: entity.FullName,
                phone: entity.Phone,
                avatarUrl: entity.AvatarUrl,
                avatarCloudinaryPublicId: entity.AvatarCloudinaryPublicId,
                dateOfBirth: entity.DateOfBirth,
                gender: entity.Gender,
                address: entity.Address,
                createdAt: entity.CreatedAt,
                updatedAt: entity.UpdatedAt
            );
        }

        public static UserProfile ToEntity(this UserProfileDomain domain)
        {
            return new UserProfile
            {
                ProfileId = domain.Id,
                UserId = domain.UserId,
                FullName = domain.FullName,
                Phone = domain.Phone,
                AvatarUrl = domain.AvatarUrl,
                AvatarCloudinaryPublicId = domain.AvatarCloudinaryPublicId,
                DateOfBirth = domain.DateOfBirth,
                Gender = domain.Gender,
                Address = domain.Address,
                CreatedAt = domain.CreatedAt,
                UpdatedAt = domain.UpdatedAt
            };
        }
    }
}
