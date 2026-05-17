using System;

namespace PetOmiPlatform.Application.Features.Pet.DTOs.Response
{
    // Response trả về khi tạo hoặc lấy thông tin 1 pet
    public class PetResponse
    {
        public Guid PetId { get; set; }

        public Guid OwnerUserId { get; set; }

        public string Name { get; set; } = null!;

        public string Species { get; set; } = null!;

        public string? Breed { get; set; }

        public string? Gender { get; set; }

        public string? IsNeutered { get; set; }

        public DateOnly? DateOfBirth { get; set; }

        public bool IsBirthDateEstimated { get; set; }

        public string? AvatarUrl { get; set; }

        public string? Color { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }
}
