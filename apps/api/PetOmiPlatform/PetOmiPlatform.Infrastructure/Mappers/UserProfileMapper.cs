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
                dateOfBirth: entity.DateOfBirth,
                gender: entity.Gender,
                address: entity.Address,
                createdAt: entity.CreatedAt,
                updatedAt: entity.UpdatedAt
            );
        }
    }
}
