using System;

namespace PetOmiPlatform.Application.Features.UserProfile.DTOs.Response
{
    public class UserProfileResponse
    {
        public Guid ProfileId { get; set; }
        public Guid UserId { get; set; }
        public string? FullName { get; set; }
        public string? Phone { get; set; }
        public string? AvatarUrl { get; set; }
        public string? AvatarCloudinaryPublicId { get; set; }
        public DateOnly? DateOfBirth { get; set; }
        public string? Gender { get; set; }
        public string? Address { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CompleteProfileResponse
    {
        public Guid ProfileId { get; set; }
        public Guid UserId { get; set; }
        public string? FullName { get; set; }
        public string? Phone { get; set; }
        public DateOnly? DateOfBirth { get; set; }
        public string? Gender { get; set; }
        public string? Address { get; set; }
        public bool IsProfileCompleted { get; set; }
    }
}
