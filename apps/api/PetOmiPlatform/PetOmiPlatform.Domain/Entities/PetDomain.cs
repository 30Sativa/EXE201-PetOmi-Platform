using PetOmiPlatform.Domain.Common;
using PetOmiPlatform.Domain.Exceptions;
using System;

namespace PetOmiPlatform.Domain.Entities
{
    public class PetDomain : BaseEntity
    {
        public Guid OwnerUserId { get; private set; }
        public string Name { get; private set; }
        public string Species { get; private set; }           // "Dog" hoặc "Cat"
        public string? Breed { get; private set; }
        public string? Gender { get; private set; }           // "Male" / "Female" / "Unknown"
        public string? IsNeutered { get; private set; }       // "Yes" / "No" / "Unknown"
        public DateOnly? DateOfBirth { get; private set; }
        public bool IsBirthDateEstimated { get; private set; }
        public string? AvatarUrl { get; private set; }
        public string? Color { get; private set; }
        public bool IsActive { get; private set; }
        public DateTime? DeletedAt { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public DateTime? UpdatedAt { get; private set; }

        // === Constructors ===
        // Private constructor để EF Core và Reconstitute dùng
        private PetDomain() { }

        // Constructor nội bộ cho factory method Create
        private PetDomain(
            Guid ownerUserId,
            string name,
            string species,
            string? breed,
            string? gender,
            string? isNeutered,
            DateOnly? dateOfBirth,
            bool isBirthDateEstimated,
            string? avatarUrl,
            string? color)
        {
            Id = Guid.NewGuid();
            OwnerUserId = ownerUserId;
            Name = name;
            Species = species;
            Breed = breed;
            Gender = gender;
            IsNeutered = isNeutered;
            DateOfBirth = dateOfBirth;
            IsBirthDateEstimated = isBirthDateEstimated;
            AvatarUrl = avatarUrl;
            Color = color;
            IsActive = true;
            CreatedAt = DateTime.UtcNow;
        }

        // === Factory Methods ===

        // Tạo hồ sơ thú cưng mới
        public static PetDomain Create(
            Guid ownerUserId,
            string name,
            string species,
            string? breed,
            string? gender,
            string? isNeutered,
            DateOnly? dateOfBirth,
            bool isBirthDateEstimated,
            string? avatarUrl,
            string? color)
        {
            return new PetDomain(
                ownerUserId, name, species, breed,
                gender, isNeutered, dateOfBirth,
                isBirthDateEstimated, avatarUrl, color);
        }

        // Khôi phục đối tượng từ dữ liệu DB (dùng trong repository)
        public static PetDomain Reconstitute(
            Guid id,
            Guid ownerUserId,
            string name,
            string species,
            string? breed,
            string? gender,
            string? isNeutered,
            DateOnly? dateOfBirth,
            bool isBirthDateEstimated,
            string? avatarUrl,
            string? color,
            bool isActive,
            DateTime? deletedAt,
            DateTime createdAt,
            DateTime? updatedAt)
        {
            return new PetDomain
            {
                Id = id,
                OwnerUserId = ownerUserId,
                Name = name,
                Species = species,
                Breed = breed,
                Gender = gender,
                IsNeutered = isNeutered,
                DateOfBirth = dateOfBirth,
                IsBirthDateEstimated = isBirthDateEstimated,
                AvatarUrl = avatarUrl,
                Color = color,
                IsActive = isActive,
                DeletedAt = deletedAt,
                CreatedAt = createdAt,
                UpdatedAt = updatedAt
            };
        }

        // === Behavior Methods (Domain Logic) ===

        // Cập nhật thông tin hồ sơ pet
        public void UpdateInfo(
            string name,
            string species,
            string? breed,
            string? gender,
            string? isNeutered,
            DateOnly? dateOfBirth,
            bool isBirthDateEstimated,
            string? avatarUrl,
            string? color)
        {
            Name = name;
            Species = species;
            Breed = breed;
            Gender = gender;
            IsNeutered = isNeutered;
            DateOfBirth = dateOfBirth;
            IsBirthDateEstimated = isBirthDateEstimated;
            AvatarUrl = avatarUrl;
            Color = color;
            UpdatedAt = DateTime.UtcNow;
        }

        // Xóa mềm hồ sơ — không bao giờ xóa cứng khỏi DB
        public void SoftDelete()
        {
            if (!IsActive)
                throw new DomainException("Hồ sơ thú cưng này đã bị xóa trước đó.");

            IsActive = false;
            DeletedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }

        // Kiểm tra quyền sở hữu — chỉ chủ nuôi mới được thao tác
        public void EnsureOwner(Guid requestUserId)
        {
            if (OwnerUserId != requestUserId)
                throw new DomainException("Bạn không có quyền thao tác với hồ sơ thú cưng này.");
        }

        // Kiểm tra hồ sơ còn hoạt động không
        public void EnsureActive()
        {
            if (!IsActive)
                throw new DomainException("Hồ sơ thú cưng này đã bị xóa.");
        }
    }
}
