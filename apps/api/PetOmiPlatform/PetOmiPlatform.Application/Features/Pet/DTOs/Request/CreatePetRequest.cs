using System;

namespace PetOmiPlatform.Application.Features.Pet.DTOs.Request
{
    // Request tạo hồ sơ thú cưng mới
    public class CreatePetRequest
    {
        public string Name { get; set; } = null!;           // Tên pet — bắt buộc

        public string Species { get; set; } = null!;        // Loài: "Dog" hoặc "Cat"

        public string? Breed { get; set; }                  // Giống — tùy chọn

        public string? Gender { get; set; }                 // "Male" / "Female" / "Unknown"

        public string? IsNeutered { get; set; }             // "Yes" / "No" / "Unknown"

        public DateOnly? DateOfBirth { get; set; }          // Ngày sinh — để trống nếu không nhớ

        public bool IsBirthDateEstimated { get; set; }      // true = ngày sinh là ước tính

        public string? AvatarUrl { get; set; }              // URL ảnh đại diện

        public string? Color { get; set; }                  // Màu lông / đặc điểm nhận dạng
    }
}
