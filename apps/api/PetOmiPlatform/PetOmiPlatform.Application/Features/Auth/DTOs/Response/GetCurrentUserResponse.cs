using System;
using System.Collections.Generic;

namespace PetOmiPlatform.Application.Features.Auth.DTOs.Response
{
    public class GetCurrentUserResponse
    {
        public Guid UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public bool EmailVerified { get; set; }
        public bool HasPassword { get; set; }
        public bool IsActive { get; set; }
        public bool IsProfileCompleted { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public UserProfileInfo? Profile { get; set; }
        public List<string> Roles { get; set; } = new();
        public VetProfileInfo? VetProfile { get; set; }
    }

    public class UserProfileInfo
    {
        public string? FullName { get; set; }
        public string? Phone { get; set; }
        public string? AvatarUrl { get; set; }
        public string? AvatarCloudinaryPublicId { get; set; }
        public DateOnly? DateOfBirth { get; set; }
        public string? Gender { get; set; }
        public string? Address { get; set; }
    }

    public class VetProfileInfo
    {
        public Guid VetProfileId { get; set; }
        public string? Specialization { get; set; }
        public string? LicenseNumber { get; set; }
        public bool IsActive { get; set; }
    }
}
