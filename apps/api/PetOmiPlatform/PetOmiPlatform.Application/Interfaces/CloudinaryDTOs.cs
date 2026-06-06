namespace PetOmiPlatform.Application.Interfaces
{
    public class CloudinaryUploadResult
    {
        public string SecureUrl { get; set; } = null!;
        public string PublicId { get; set; } = null!;
        public long FileSizeBytes { get; set; }
        public string Format { get; set; } = null!;
        public int Width { get; set; }
        public int Height { get; set; }
    }

    public class CloudinaryUploadOptions
    {
        public required string Folder { get; set; }
        public required string PublicId { get; set; }
        public bool IsRawFile { get; set; }
    }
}
