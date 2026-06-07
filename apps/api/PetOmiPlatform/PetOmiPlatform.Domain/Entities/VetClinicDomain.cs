using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Common.Constants;
using PetOmiPlatform.Domain.Exceptions;

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
            Guid id,
            Guid vetProfileId,
            Guid clinicId,
            Guid roleId,
            DateOnly startDate,
            bool isActive,
            DateTime createdAt,
            DateTime? updatedAt)
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

        public void ChangeRole(Guid roleId, DateTime changedAtUtc)
        {
            if (!IsActive)
                throw new DomainException("Khong the cap nhat vai tro cho staff da ngung hoat dong.");

            if (roleId != ClinicRoleConstants.PrimaryVetId &&
                roleId != ClinicRoleConstants.AssistantId &&
                roleId != ClinicRoleConstants.CashierId)
            {
                throw new DomainException("Role staff khong hop le.");
            }

            if (RoleId == roleId)
                throw new DomainException("Vai tro moi trung voi vai tro hien tai.");

            RoleId = roleId;
            UpdatedAt = changedAtUtc;
        }

        public void Deactivate(DateTime deactivatedAtUtc)
        {
            if (!IsActive)
                throw new DomainException("Staff da ngung hoat dong truoc do.");

            if (RoleId == ClinicRoleConstants.ClinicOwnerId)
                throw new DomainException("Khong the ngung hoat dong ClinicOwner.");

            IsActive = false;
            UpdatedAt = deactivatedAtUtc;
        }
    }
}
