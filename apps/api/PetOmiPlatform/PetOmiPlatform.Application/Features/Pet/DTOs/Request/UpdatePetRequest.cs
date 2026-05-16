using System;

namespace PetOmiPlatform.Application.Features.Pet.DTOs.Request
{
    // Request cập nhật hồ sơ thú cưng — tất cả field đều optional, chỉ update những gì gửi lên
    public class UpdatePetRequest
    {
        public string Name { get; set; } = null!;           // Tên pet — bắt buộc (không cho để trống)

        public string Species { get; set; } = null!;        // Loài: "Dog" hoặc "Cat"

        public string? Breed { get; set; }                  // Giống

        public string? Gender { get; set; }                 // "Male" / "Female" / "Unknown"

        public string? IsNeutered { get; set; }             // "Yes" / "No" / "Unknown"

        public DateOnly? DateOfBirth { get; set; }          // Ngày sinh

        public bool IsBirthDateEstimated { get; set; }      // true = ước tính

        public string? AvatarUrl { get; set; }              // URL ảnh đại diện

        public string? Color { get; set; }                  // Màu lông / đặc điểm nhận dạng
    }
}
