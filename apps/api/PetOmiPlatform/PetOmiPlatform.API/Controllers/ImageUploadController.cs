using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.API.Common.Validators;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Interfaces;
using MediatR;

namespace PetOmiPlatform.API.Controllers
{
    /// <summary>
    /// API upload và xóa ảnh dùng Cloudinary.
    /// </summary>
    [Route("api/images")]
    [ApiController]
    [Authorize]
    public class ImageUploadController : BaseController
    {
        private readonly ICloudinaryService _cloudinaryService;
        private readonly CloudinaryUploadValidator _validator;
        private readonly ILogger<ImageUploadController> _logger;

        private static readonly Dictionary<string, string> FolderMap = new(StringComparer.OrdinalIgnoreCase)
        {
            ["pet_photo"] = "pets/{petId}/photos",
            ["pet_avatar"] = "pets/{petId}/avatar",
            ["clinic_logo"] = "clinics/{clinicId}/logo",
            ["clinic_license"] = "clinics/{clinicId}/license",
            ["inventory_item"] = "clinics/{clinicId}/inventory-items",
            ["user_avatar"] = "users/{userId}/avatar",
            ["medical_attachment"] = "medical-records/{petId}/attachments"
        };

        public ImageUploadController(
            IMediator mediator,
            ICloudinaryService cloudinaryService,
            ILogger<ImageUploadController> logger)
            : base(mediator)
        {
            _cloudinaryService = cloudinaryService;
            _validator = new CloudinaryUploadValidator();
            _logger = logger;
        }

        /// <summary>Upload ảnh lên Cloudinary theo imageType và resourceId tương ứng.</summary>
        [HttpPost]
        [Consumes("multipart/form-data")]
        [ProducesResponseType(typeof(BaseResponse<CloudinaryUploadResult>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(BaseResponse<object>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UploadImage(
            [FromForm] UploadImageRequest request,
            CancellationToken cancellationToken)
        {
            var (isValid, error) = _validator.Validate(request.File);
            if (!isValid)
            {
                return BadRequest(BaseResponse<object>.Fail(error!));
            }

            if (string.IsNullOrWhiteSpace(request.ImageType))
            {
                return BadRequest(BaseResponse<object>.Fail("ImageType là bắt buộc."));
            }

            if (!FolderMap.TryGetValue(request.ImageType, out var folderTemplate))
            {
                return BadRequest(BaseResponse<object>.Fail(
                    $"ImageType không hợp lệ. Các loại được hỗ trợ: {string.Join(", ", FolderMap.Keys)}"));
            }

            var userId = CurrentUserId.ToString();
            string folder;

            if (folderTemplate.Contains("{petId}"))
            {
                if (string.IsNullOrWhiteSpace(request.ResourceId))
                {
                    if (request.ImageType.Equals("pet_avatar", StringComparison.OrdinalIgnoreCase))
                    {
                        folder = $"pets/pending/{userId}/avatar";
                    }
                    else
                    {
                        return BadRequest(BaseResponse<object>.Fail($"Với imageType '{request.ImageType}', resourceId (petId) là bắt buộc."));
                    }
                }
                else
                {
                    folder = folderTemplate.Replace("{petId}", request.ResourceId, StringComparison.OrdinalIgnoreCase);
                }
            }
            else if (folderTemplate.Contains("{clinicId}"))
            {
                if (string.IsNullOrWhiteSpace(request.ResourceId))
                {
                    if (request.ImageType.Equals("clinic_license", StringComparison.OrdinalIgnoreCase))
                    {
                        folder = $"clinics/pending/{userId}/license";
                    }
                    else if (request.ImageType.Equals("clinic_logo", StringComparison.OrdinalIgnoreCase))
                    {
                        folder = $"clinics/pending/{userId}/logo";
                    }
                    else
                    {
                        return BadRequest(BaseResponse<object>.Fail($"Với imageType '{request.ImageType}', resourceId (clinicId) là bắt buộc."));
                    }
                }
                else
                {
                    folder = folderTemplate.Replace("{clinicId}", request.ResourceId, StringComparison.OrdinalIgnoreCase);
                }
            }
            else if (folderTemplate.Contains("{userId}"))
            {
                folder = folderTemplate.Replace("{userId}", userId, StringComparison.OrdinalIgnoreCase);
            }
            else
            {
                folder = folderTemplate;
            }

            var publicId = $"{Guid.NewGuid()}";
            var fileName = $"{publicId}{Path.GetExtension(request.File.FileName)}";

            await using var stream = request.File.OpenReadStream();
            var result = await _cloudinaryService.UploadAsync(
                stream,
                fileName,
                new CloudinaryUploadOptions
                {
                    Folder = folder,
                    PublicId = publicId
                },
                cancellationToken);

            _logger.LogInformation(
                "Image uploaded: Type={ImageType}, PublicId={PublicId}, Size={Size}",
                request.ImageType, result.PublicId, result.FileSizeBytes);

            return Ok(BaseResponse<CloudinaryUploadResult>.Ok(result, "Upload ảnh thành công."));
        }

        /// <summary>Xóa ảnh khỏi Cloudinary theo publicId.</summary>
        [HttpDelete]
        [ProducesResponseType(typeof(BaseResponse<object>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(BaseResponse<object>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> DeleteImage(
            [FromQuery] string publicId,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(publicId))
            {
                return BadRequest(BaseResponse<object>.Fail("publicId là bắt buộc."));
            }

            await _cloudinaryService.DeleteAsync(publicId, cancellationToken);
            return Ok(BaseResponse<object>.Ok(null, "Xóa ảnh thành công."));
        }
    }

    public record UploadImageRequest
    {
        public IFormFile File { get; set; } = null!;
        public string ImageType { get; set; } = string.Empty;
        public string? ResourceId { get; set; }
    }
}
