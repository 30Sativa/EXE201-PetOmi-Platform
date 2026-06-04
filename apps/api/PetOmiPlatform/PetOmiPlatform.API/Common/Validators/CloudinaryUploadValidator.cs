using Microsoft.AspNetCore.Http;

namespace PetOmiPlatform.API.Common.Validators
{
    public class CloudinaryUploadValidator
    {
        private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg", ".jpeg", ".png", ".webp"
        };

        private static readonly HashSet<string> AllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg", "image/png", "image/webp"
        };

        private const long MaxSizeBytes = 5 * 1024 * 1024; // 5MB

        public (bool isValid, string? error) Validate(IFormFile? file)
        {
            if (file == null || file.Length == 0)
            {
                return (false, "File ảnh không được để trống.");
            }

            if (file.Length > MaxSizeBytes)
            {
                return (false, $"Kích thước file vượt quá giới hạn 5MB. File hiện tại: {file.Length / 1024.0 / 1024.0:F2}MB.");
            }

            var extension = Path.GetExtension(file.FileName)?.ToLowerInvariant() ?? string.Empty;
            if (!AllowedExtensions.Contains(extension))
            {
                return (false, "Định dạng file không được hỗ trợ. Chỉ chấp nhận: jpg, jpeg, png, webp.");
            }

            if (!AllowedMimeTypes.Contains(file.ContentType))
            {
                return (false, "Content-Type không hợp lệ. Chỉ chấp nhận: image/jpeg, image/png, image/webp.");
            }

            return (true, null);
        }
    }
}
