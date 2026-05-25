namespace PetOmiPlatform.Infrastructure.Common.Settings
{
    public class CloudinarySettings
    {
        public string CloudName { get; set; } = string.Empty;
        public string ApiKey { get; set; } = string.Empty;
        public string ApiSecret { get; set; } = string.Empty;
        public string SecurePrefix { get; set; } = "petomi";
        public int MaxFileSizeBytes { get; set; } = 5 * 1024 * 1024; // 5MB default
        public string AllowedExtensions { get; set; } = ".jpg,.jpeg,.png,.webp";
    }
}
