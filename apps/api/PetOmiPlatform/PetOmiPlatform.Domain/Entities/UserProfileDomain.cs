using PetOmiPlatform.Domain.Common;
using System;

namespace PetOmiPlatform.Domain.Entities
{
    public class UserProfileDomain : BaseEntity
    {
        public Guid UserId { get; private set; }
        public string? FullName { get; private set; }
        public string? Phone { get; private set; }
        public string? AvatarUrl { get; private set; }
        public string? AvatarCloudinaryPublicId { get; private set; }
        public DateOnly? DateOfBirth { get; private set; }
        public string? Gender { get; private set; }
        public string? Address { get; private set; }
        public DateTime CreatedAt { get; private set; }
        public DateTime? UpdatedAt { get; private set; }

        private UserProfileDomain() { }

        public static UserProfileDomain Create(
            Guid userId,
            string? fullName,
            string? phone,
            string? avatarUrl,
            string? avatarCloudinaryPublicId,
            DateOnly? dateOfBirth,
            string? gender,
            string? address)
        {
            return new UserProfileDomain
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                FullName = fullName,
                Phone = phone,
                AvatarUrl = avatarUrl,
                AvatarCloudinaryPublicId = avatarCloudinaryPublicId,
                DateOfBirth = dateOfBirth,
                Gender = gender,
                Address = address,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = null
            };
        }

        public void Update(
            string? fullName,
            string? phone,
            string? avatarUrl,
            string? avatarCloudinaryPublicId,
            DateOnly? dateOfBirth,
            string? gender,
            string? address)
        {
            if (fullName != null) FullName = fullName;
            if (phone != null) Phone = phone;
            if (avatarUrl != null) AvatarUrl = avatarUrl;
            if (avatarCloudinaryPublicId != null) AvatarCloudinaryPublicId = avatarCloudinaryPublicId;
            if (dateOfBirth != null) DateOfBirth = dateOfBirth;
            if (gender != null) Gender = gender;
            if (address != null) Address = address;
            UpdatedAt = DateTime.UtcNow;
        }

        public static UserProfileDomain Reconstitute(
            Guid id,
            Guid userId,
            string? fullName,
            string? phone,
            string? avatarUrl,
            string? avatarCloudinaryPublicId,
            DateOnly? dateOfBirth,
            string? gender,
            string? address,
            DateTime createdAt,
            DateTime? updatedAt)
        {
            return new UserProfileDomain
            {
                Id = id,
                UserId = userId,
                FullName = fullName,
                Phone = phone,
                AvatarUrl = avatarUrl,
                AvatarCloudinaryPublicId = avatarCloudinaryPublicId,
                DateOfBirth = dateOfBirth,
                Gender = gender,
                Address = address,
                CreatedAt = createdAt,
                UpdatedAt = updatedAt
            };
        }
    }
}
