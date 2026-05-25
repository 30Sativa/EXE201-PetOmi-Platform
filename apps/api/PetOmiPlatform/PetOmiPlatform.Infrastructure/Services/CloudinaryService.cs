using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Infrastructure.Common.Settings;

namespace PetOmiPlatform.Infrastructure.Services;

public class CloudinaryService : ICloudinaryService
{
    private readonly CloudinaryDotNet.Cloudinary _cloudinary;
    private readonly CloudinarySettings _settings;
    private readonly ILogger<CloudinaryService> _logger;

    public CloudinaryService(
        IOptions<CloudinarySettings> settings,
        ILogger<CloudinaryService> logger)
    {
        _settings = settings.Value;
        _logger = logger;

        var account = new Account(
            _settings.CloudName,
            _settings.ApiKey,
            _settings.ApiSecret);

        _cloudinary = new CloudinaryDotNet.Cloudinary(account);
    }

    public async Task<CloudinaryUploadResult> UploadAsync(
        Stream fileStream,
        string fileName,
        CloudinaryUploadOptions options,
        CancellationToken cancellationToken = default)
    {
        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(fileName, fileStream),
            Folder = options.Folder,
            PublicId = options.PublicId,
            Overwrite = true,
            Transformation = new Transformation()
                .Quality("auto")
                .FetchFormat("auto")
        };

        var result = await _cloudinary.UploadAsync(uploadParams, cancellationToken);

        if (result.Error != null)
        {
            _logger.LogError("Cloudinary upload failed: {Error}", result.Error.Message);
            throw new InvalidOperationException($"Upload ảnh thất bại: {result.Error.Message}");
        }

        _logger.LogInformation(
            "Cloudinary upload success: PublicId={PublicId}, Url={Url}",
            result.PublicId, result.SecureUrl);

        return new CloudinaryUploadResult
        {
            SecureUrl = result.SecureUrl.ToString(),
            PublicId = result.PublicId,
            FileSizeBytes = result.Bytes,
            Format = result.Format,
            Width = result.Width,
            Height = result.Height
        };
    }

    public async Task DeleteAsync(string publicId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(publicId))
            return;

        var deleteParams = new DeletionParams(publicId);
        var result = await _cloudinary.DestroyAsync(deleteParams);

        if (result.Error != null)
        {
            _logger.LogWarning(
                "Cloudinary delete failed for PublicId={PublicId}: {Error}",
                publicId, result.Error.Message);
        }
        else
        {
            _logger.LogInformation("Cloudinary delete success: PublicId={PublicId}", publicId);
        }
    }
}
