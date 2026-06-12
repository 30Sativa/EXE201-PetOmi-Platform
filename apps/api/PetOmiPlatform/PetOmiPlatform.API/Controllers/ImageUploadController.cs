using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.API.Common.Validators;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Interfaces;

namespace PetOmiPlatform.API.Controllers
{
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

        [HttpPost]
        [Consumes("multipart/form-data")]
        [ProducesResponseType(typeof(BaseResponse<CloudinaryUploadResult>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(BaseResponse<object>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UploadImage(
            [FromForm] UploadImageRequest request,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.ImageType))
            {
                return BadRequest(BaseResponse<object>.Fail("ImageType la bat buoc."));
            }

            var (isValid, error) = _validator.Validate(request.File, request.ImageType);
            if (!isValid)
            {
                return BadRequest(BaseResponse<object>.Fail(error!));
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
                        return BadRequest(BaseResponse<object>.Fail($"Voi imageType '{request.ImageType}', resourceId (petId) la bat buoc."));
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
                        return BadRequest(BaseResponse<object>.Fail($"Voi imageType '{request.ImageType}', resourceId (clinicId) la bat buoc."));
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
            var isRawFile = request.File.ContentType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase);

            await using var stream = request.File.OpenReadStream();
            var result = await _cloudinaryService.UploadAsync(
                stream,
                fileName,
                new CloudinaryUploadOptions
                {
                    Folder = folder,
                    PublicId = publicId,
                    IsRawFile = isRawFile
                },
                cancellationToken);

            _logger.LogInformation(
                "File uploaded: Type={ImageType}, PublicId={PublicId}, Size={Size}",
                request.ImageType, result.PublicId, result.FileSizeBytes);

            return Ok(BaseResponse<CloudinaryUploadResult>.Ok(result, "Upload file thành công."));
        }

        [HttpDelete]
        [ProducesResponseType(typeof(BaseResponse<object>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(BaseResponse<object>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> DeleteImage(
            [FromQuery] string publicId,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(publicId))
            {
                return BadRequest(BaseResponse<object>.Fail("publicId la bat buoc."));
            }

            await _cloudinaryService.DeleteAsync(publicId, cancellationToken);
            return Ok(BaseResponse<object>.Ok(null, "Xóa file thành công."));
        }
    }

    public record UploadImageRequest
    {
        public IFormFile File { get; set; } = null!;
        public string ImageType { get; set; } = string.Empty;
        public string? ResourceId { get; set; }
    }
}
