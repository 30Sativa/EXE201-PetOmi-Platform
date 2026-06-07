using Microsoft.AspNetCore.Http;

namespace PetOmiPlatform.API.Common.Validators
{
    public class CloudinaryUploadValidator
    {
        private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg", ".jpeg", ".png", ".webp"
        };

        private static readonly HashSet<string> AllowedClinicLicenseExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg", ".jpeg", ".png", ".webp", ".pdf"
        };

        private static readonly HashSet<string> AllowedMimeTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg", "image/png", "image/webp"
        };

        private static readonly HashSet<string> AllowedClinicLicenseMimeTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg", "image/png", "image/webp", "application/pdf"
        };

        private const long MaxSizeBytes = 5 * 1024 * 1024; // 5MB

        public (bool isValid, string? error) Validate(IFormFile? file, string? imageType = null)
        {
            if (file == null || file.Length == 0)
            {
                return (false, "File khong duoc de trong.");
            }

            if (file.Length > MaxSizeBytes)
            {
                return (false, $"Kich thuoc file vuot qua gioi han 5MB. File hien tai: {file.Length / 1024.0 / 1024.0:F2}MB.");
            }

            var isClinicLicense = string.Equals(imageType, "clinic_license", StringComparison.OrdinalIgnoreCase);
            var allowedExtensions = isClinicLicense ? AllowedClinicLicenseExtensions : AllowedExtensions;
            var allowedMimeTypes = isClinicLicense ? AllowedClinicLicenseMimeTypes : AllowedMimeTypes;

            var extension = Path.GetExtension(file.FileName)?.ToLowerInvariant() ?? string.Empty;
            if (!allowedExtensions.Contains(extension))
            {
                return (false, isClinicLicense
                    ? "Dinh dang file khong duoc ho tro. Chi chap nhan: jpg, jpeg, png, webp, pdf."
                    : "Dinh dang file khong duoc ho tro. Chi chap nhan: jpg, jpeg, png, webp.");
            }

            if (!allowedMimeTypes.Contains(file.ContentType))
            {
                return (false, isClinicLicense
                    ? "Content-Type khong hop le. Chi chap nhan: image/jpeg, image/png, image/webp, application/pdf."
                    : "Content-Type khong hop le. Chi chap nhan: image/jpeg, image/png, image/webp.");
            }

            return (true, null);
        }
    }
}
