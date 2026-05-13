using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Exceptions;
using System;
using System.Collections.Generic;
using System.Text;

namespace PetOmiPlatform.Domain.Entities
{
    public class VetProfileDomain : BaseEntity
    {
        public Guid UserId { get; private set; }
        public string? LicenseNumber { get; private set; }
        public string? Specialization { get; private set; }
        public bool IsActive { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public DateTime? UpdatedAt { get; private set; }


        // === Constructors ===

        private VetProfileDomain() { }

        private VetProfileDomain(Guid userId, string? licenseNumber, string? specialization)
        {
            Id = Guid.NewGuid();
            UserId = userId;
            LicenseNumber = licenseNumber;
            Specialization = specialization;
            IsActive = true;
            CreatedAt = DateTime.UtcNow;
        }

        // reconstitution constructor

        public static VetProfileDomain Reconstitute(
            Guid id,
            Guid userId,
            string? licenseNumber,
            string? specialization,
            bool isActive,
            DateTime createdAt,
            DateTime? updatedAt)
        {
            var profile = new VetProfileDomain
            {
                Id = id,
                UserId = userId,
                LicenseNumber = licenseNumber,
                Specialization = specialization,
                IsActive = isActive,
                CreatedAt = createdAt,
                UpdatedAt = updatedAt
            };
            return profile;
        }


        // Factory method for creating a new vet profile

        public static VetProfileDomain Create(Guid userId, string? licenseNumber, string? specialization)
        {
            return new VetProfileDomain(userId, licenseNumber, specialization);
        }

        // behavior methods (e.g., update profile, deactivate profile)


        public void Deactivate()
        {
            if (IsActive)
            {
                throw new DomainException("Hồ sơ bác sĩ thú y đã bị vô hiệu hóa trước đó.");
            }
            IsActive = false;
            UpdatedAt = DateTime.UtcNow;
        }

        public void UpdateInfo(string? licenseNumber, string? specialization)
        {
            if (!IsActive)
            {
                throw new DomainException("Không thể cập nhật hồ sơ bác sĩ thú y đã bị vô hiệu hóa.");
            }
            LicenseNumber = licenseNumber;
            Specialization = specialization;
            UpdatedAt = DateTime.UtcNow;
        }
    }
}