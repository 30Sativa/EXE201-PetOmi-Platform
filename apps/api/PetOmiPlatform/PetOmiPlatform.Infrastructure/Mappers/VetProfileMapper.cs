using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Infrastructure.Mappers
{
    public static class VetProfileMapper
    {
        // EF Entity → Domain
        public static VetProfileDomain ToDomain(this VetProfile entity)
        {
            return VetProfileDomain.Reconstitute(
                id: entity.VetProfileId,
                userId: entity.UserId,
                licenseNumber: entity.LicenseNumber,
                specialization: entity.Specialization,
                isActive: entity.IsActive,
                createdAt: entity.CreatedAt,
                updatedAt: entity.UpdatedAt
            );
        }

        // Domain → EF Entity
        public static VetProfile ToEntity(this VetProfileDomain domain)
        {
            return new VetProfile
            {
                VetProfileId = domain.Id,
                UserId = domain.UserId,
                LicenseNumber = domain.LicenseNumber,
                Specialization = domain.Specialization,
                IsActive = domain.IsActive,
                CreatedAt = domain.CreatedAt,
                UpdatedAt = domain.UpdatedAt
            };
        }
    }
}
