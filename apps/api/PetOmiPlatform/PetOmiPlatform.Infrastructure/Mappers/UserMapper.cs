using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Infrastructure.Mappers
{
    public static class UserMapper
    {
        // EF Entity -> Domain
        public static UserDomain ToDomain(this User entity)
        {
            return UserDomain.Reconstitute(
                id: entity.UserId,
                email: entity.Email,
                passwordHash: entity.PasswordHash,
                emailVerified: entity.EmailVerified,
                failedLoginAttempts: entity.FailedLoginAttempts,
                lockoutUntil: entity.LockoutUntil,
                createdAt: entity.CreatedAt,
                updatedAt: entity.UpdatedAt,
                lastLoginAt: entity.LastLoginAt,
                deletedAt: entity.DeletedAt,
                isActive: entity.IsActive
                );
        }

        // Domain -> EF Entity

        public static User ToEntity(this UserDomain domain)
        {
            return new User
            {
                UserId = domain.Id,
                Email = domain.Email.Value,
                NormalizedEmail = domain.Email.NormalizedValue,
                PasswordHash = domain.PasswordHash.Value,
                EmailVerified = domain.EmailVerified,
                FailedLoginAttempts = domain.FailedLoginAttempts,
                LockoutUntil = domain.LockoutUntil,
                CreatedAt = domain.CreatedAt,
                UpdatedAt = domain.UpdatedAt,
                LastLoginAt = domain.LastLoginAt,
                DeletedAt = domain.DeletedAt,
                IsActive = domain.IsActive
            };
        }
    }
}
