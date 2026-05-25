using System;

namespace PetOmiPlatform.Application.Features.UserProfile.DTOs.Request
{
    public class CreateUserProfileRequest
    {
        public string? FullName { get; set; }
        public string? Phone { get; set; }
        public string? AvatarUrl { get; set; }
        public string? AvatarCloudinaryPublicId { get; set; }
        public DateOnly? DateOfBirth { get; set; }
        public string? Gender { get; set; }
        public string? Address { get; set; }
    }
}
