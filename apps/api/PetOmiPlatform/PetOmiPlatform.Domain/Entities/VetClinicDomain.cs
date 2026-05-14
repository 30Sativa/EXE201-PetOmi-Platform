using PetOmiPlatform.Domain.Common;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Domain.Entities
{
    public class VetClinicDomain : BaseEntity
    {
        public Guid VetProfileId { get; private set; }
        public Guid ClinicId { get; private set; }
        public Guid RoleId { get; private set; }
        public DateOnly StartDate { get; private set; }
        public bool IsActive { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public DateTime? UpdatedAt { get; private set; }

        private VetClinicDomain() { }

        public VetClinicDomain(Guid vetProfileId, Guid clinicId, Guid roleId)
        {
            Id = Guid.NewGuid();
            VetProfileId = vetProfileId;
            ClinicId = clinicId;
            RoleId = roleId;
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow);
            IsActive = true;
            CreatedAt = DateTime.UtcNow;
        }

        public static VetClinicDomain Reconstitute(
            Guid id, Guid vetProfileId, Guid clinicId, Guid roleId,
            DateOnly startDate, bool isActive,
            DateTime createdAt, DateTime? updatedAt)
        {
            return new VetClinicDomain
            {
                Id = id,
                VetProfileId = vetProfileId,
                ClinicId = clinicId,
                RoleId = roleId,
                StartDate = startDate,
                IsActive = isActive,
                CreatedAt = createdAt,
                UpdatedAt = updatedAt
            };
        }
    }
}
