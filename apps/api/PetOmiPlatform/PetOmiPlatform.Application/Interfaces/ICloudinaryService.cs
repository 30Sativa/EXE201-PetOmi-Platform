namespace PetOmiPlatform.Application.Interfaces
{
    public interface ICloudinaryService
    {
        Task<CloudinaryUploadResult> UploadAsync(
            Stream fileStream,
            string fileName,
            CloudinaryUploadOptions options,
            CancellationToken cancellationToken = default);

        Task DeleteAsync(string publicId, CancellationToken cancellationToken = default);
    }
}
