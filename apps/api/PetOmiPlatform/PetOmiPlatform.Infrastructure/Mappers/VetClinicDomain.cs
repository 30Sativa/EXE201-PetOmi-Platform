using PetOmiPlatform.Domain.Entities;
using PetOmiPlatform.Infrastructure.Persistence.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Infrastructure.Mappers
{
    public static class VetClinicMapper
    {
        // EF Entity → Domain
        public static VetClinicDomain ToDomain(this VetClinic entity)
        {
            return VetClinicDomain.Reconstitute(
                id: entity.VetClinicId,
                vetProfileId: entity.VetProfileId,
                clinicId: entity.ClinicId,
                roleId: entity.RoleId,
                startDate: entity.StartDate ?? DateOnly.FromDateTime(entity.CreatedAt),
                isActive: entity.IsActive,
                createdAt: entity.CreatedAt,
                updatedAt: entity.UpdatedAt
            );
        }

        // Domain → EF Entity
        public static VetClinic ToEntity(this VetClinicDomain domain)
        {
            return new VetClinic
            {
                VetClinicId = domain.Id,
                VetProfileId = domain.VetProfileId,
                ClinicId = domain.ClinicId,
                RoleId = domain.RoleId,
                StartDate = domain.StartDate,
                IsActive = domain.IsActive,
                CreatedAt = domain.CreatedAt,
                UpdatedAt = domain.UpdatedAt
            };
        }
    }
}
