using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.Pet.Command;
using PetOmiPlatform.Application.Features.Pet.DTOs.Request;
using PetOmiPlatform.Application.Features.Pet.DTOs.Response;
using PetOmiPlatform.Application.Features.Pet.Query;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace PetOmiPlatform.API.Controllers
{
    [Route("api/pets")]
    [ApiController]
    [Authorize]
    public class PetController : BaseController
    {
        public PetController(IMediator mediator) : base(mediator) { }

        /// <summary>
        /// Lấy danh sách tất cả thú cưng mà user có quyền truy cập (sở hữu hoặc được chia sẻ).
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAccessiblePets()
        {
            var userId = GetCurrentUserId();
            var result = await Mediator.Send(new GetAccessiblePetsQuery(userId));
            return Ok(BaseResponse<List<PetResponse>>.Ok(result));
        }

        /// <summary>
        /// Lấy thông tin chi tiết 1 thú cưng theo ID.
        /// </summary>
        [HttpGet("{petId:guid}")]
        public async Task<IActionResult> GetPetById(Guid petId)
        {
            var userId = GetCurrentUserId();
            var result = await Mediator.Send(new GetPetByIdQuery(userId, petId));
            return Ok(BaseResponse<PetResponse>.Ok(result));
        }

        /// <summary>
        /// Tạo hồ sơ thú cưng mới cho chủ nuôi đang đăng nhập.
        /// Species chỉ hỗ trợ: Dog, Cat.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreatePet([FromBody] CreatePetRequest request)
        {
            var userId = GetCurrentUserId();
            var result = await Mediator.Send(new CreatePetCommand(userId, request));
            return Ok(BaseResponse<PetResponse>.Ok(result, "Tạo hồ sơ thú cưng thành công."));
        }

        /// <summary>
        /// Cập nhật thông tin thú cưng.
        /// </summary>
        [HttpPut("{petId:guid}")]
        public async Task<IActionResult> UpdatePet(Guid petId, [FromBody] UpdatePetRequest request)
        {
            var userId = GetCurrentUserId();
            var result = await Mediator.Send(new UpdatePetCommand(userId, petId, request));
            return Ok(BaseResponse<PetResponse>.Ok(result, "Cập nhật thông tin thú cưng thành công."));
        }

        /// <summary>
        /// Xóa mềm hồ sơ thú cưng.
        /// </summary>
        [HttpDelete("{petId:guid}")]
        public async Task<IActionResult> DeletePet(Guid petId)
        {
            var userId = GetCurrentUserId();
            await Mediator.Send(new DeletePetCommand(userId, petId));
            return Ok(BaseResponse<object>.Ok(null, "Xóa hồ sơ thú cưng thành công."));
        }

        // ==================== Health Profile ====================

        /// <summary>
        /// Lấy hồ sơ sức khỏe của thú cưng.
        /// </summary>
        [HttpGet("{petId:guid}/health-profile")]
        public async Task<IActionResult> GetPetHealthProfile(Guid petId)
        {
            var userId = GetCurrentUserId();
            var result = await Mediator.Send(new GetPetHealthProfileQuery(userId, petId));
            return Ok(BaseResponse<PetHealthProfileResponse>.Ok(result));
        }

        /// <summary>
        /// Tạo hồ sơ sức khỏe cho thú cưng.
        /// </summary>
        [HttpPost("{petId:guid}/health-profile")]
        public async Task<IActionResult> CreatePetHealthProfile(Guid petId, [FromBody] CreatePetHealthProfileRequest request)
        {
            var userId = GetCurrentUserId();
            var result = await Mediator.Send(new CreatePetHealthProfileCommand(userId, petId, request));
            return Ok(BaseResponse<PetHealthProfileResponse>.Ok(result, "Tạo hồ sơ sức khỏe thành công."));
        }

        /// <summary>
        /// Cập nhật hồ sơ sức khỏe của thú cưng.
        /// </summary>
        [HttpPut("{petId:guid}/health-profile")]
        public async Task<IActionResult> UpdatePetHealthProfile(Guid petId, [FromBody] UpdatePetHealthProfileRequest request)
        {
            var userId = GetCurrentUserId();
            var result = await Mediator.Send(new UpdatePetHealthProfileCommand(userId, petId, request));
            return Ok(BaseResponse<PetHealthProfileResponse>.Ok(result, "Cập nhật hồ sơ sức khỏe thành công."));
        }

        // ==================== Weight Logs ====================

        /// <summary>
        /// Lấy lịch sử cân nặng của thú cưng.
        /// </summary>
        [HttpGet("{petId:guid}/weight-logs")]
        public async Task<IActionResult> GetPetWeightLogs(Guid petId)
        {
            var userId = GetCurrentUserId();
            var result = await Mediator.Send(new GetPetWeightLogsQuery(userId, petId));
            return Ok(BaseResponse<List<PetWeightLogResponse>>.Ok(result));
        }

        /// <summary>
        /// Ghi nhận cân nặng mới cho thú cưng.
        /// </summary>
        [HttpPost("{petId:guid}/weight-logs")]
        public async Task<IActionResult> CreatePetWeightLog(Guid petId, [FromBody] CreatePetWeightLogRequest request)
        {
            var userId = GetCurrentUserId();
            var result = await Mediator.Send(new CreatePetWeightLogCommand(userId, petId, request));
            return Ok(BaseResponse<PetWeightLogResponse>.Ok(result, "Ghi nhận cân nặng thành công."));
        }

        /// <summary>
        /// Xóa bản ghi cân nặng.
        /// </summary>
        [HttpDelete("{petId:guid}/weight-logs/{weightLogId:guid}")]
        public async Task<IActionResult> DeletePetWeightLog(Guid petId, Guid weightLogId)
        {
            var userId = GetCurrentUserId();
            await Mediator.Send(new DeletePetWeightLogCommand(userId, petId, weightLogId));
            return Ok(BaseResponse<object>.Ok(null, "Xóa bản ghi cân nặng thành công."));
        }

        // ==================== Photos ====================

        /// <summary>
        /// Lấy danh sách ảnh của thú cưng.
        /// </summary>
        [HttpGet("{petId:guid}/photos")]
        public async Task<IActionResult> GetPetPhotos(Guid petId)
        {
            var userId = GetCurrentUserId();
            var result = await Mediator.Send(new GetPetPhotosQuery(userId, petId));
            return Ok(BaseResponse<List<PetPhotoResponse>>.Ok(result));
        }

        /// <summary>
        /// Thêm ảnh mới cho thú cưng.
        /// </summary>
        [HttpPost("{petId:guid}/photos")]
        public async Task<IActionResult> CreatePetPhoto(Guid petId, [FromBody] CreatePetPhotoRequest request)
        {
            var userId = GetCurrentUserId();
            var result = await Mediator.Send(new CreatePetPhotoCommand(userId, petId, request));
            return Ok(BaseResponse<PetPhotoResponse>.Ok(result, "Thêm ảnh thành công."));
        }

        /// <summary>
        /// Cập nhật thông tin ảnh.
        /// </summary>
        [HttpPut("{petId:guid}/photos/{photoId:guid}")]
        public async Task<IActionResult> UpdatePetPhoto(Guid petId, Guid photoId, [FromBody] UpdatePetPhotoRequest request)
        {
            var userId = GetCurrentUserId();
            var result = await Mediator.Send(new UpdatePetPhotoCommand(userId, petId, photoId, request));
            return Ok(BaseResponse<PetPhotoResponse>.Ok(result, "Cập nhật ảnh thành công."));
        }

        /// <summary>
        /// Xóa ảnh của thú cưng.
        /// </summary>
        [HttpDelete("{petId:guid}/photos/{photoId:guid}")]
        public async Task<IActionResult> DeletePetPhoto(Guid petId, Guid photoId)
        {
            var userId = GetCurrentUserId();
            await Mediator.Send(new DeletePetPhotoCommand(userId, petId, photoId));
            return Ok(BaseResponse<object>.Ok(null, "Xóa ảnh thành công."));
        }

        // ==================== Medical Records ====================

        /// <summary>
        /// Lấy danh sách hồ sơ y tế của thú cưng.
        /// </summary>
        [HttpGet("{petId:guid}/medical-records")]
        public async Task<IActionResult> GetPetMedicalRecords(Guid petId, [FromQuery] string? recordType = null)
        {
            var userId = GetCurrentUserId();
            var result = await Mediator.Send(new GetPetMedicalRecordsQuery(userId, petId, recordType));
            return Ok(BaseResponse<List<PetMedicalRecordResponse>>.Ok(result));
        }

        /// <summary>
        /// Thêm hồ sơ y tế mới cho thú cưng.
        /// </summary>
        [HttpPost("{petId:guid}/medical-records")]
        public async Task<IActionResult> CreatePetMedicalRecord(Guid petId, [FromBody] CreatePetMedicalRecordRequest request)
        {
            var userId = GetCurrentUserId();
            var result = await Mediator.Send(new CreatePetMedicalRecordCommand(userId, petId, request));
            return Ok(BaseResponse<PetMedicalRecordResponse>.Ok(result, "Thêm hồ sơ y tế thành công."));
        }

        /// <summary>
        /// Cập nhật hồ sơ y tế.
        /// </summary>
        [HttpPut("{petId:guid}/medical-records/{medicalRecordId:guid}")]
        public async Task<IActionResult> UpdatePetMedicalRecord(Guid petId, Guid medicalRecordId, [FromBody] UpdatePetMedicalRecordRequest request)
        {
            var userId = GetCurrentUserId();
            var result = await Mediator.Send(new UpdatePetMedicalRecordCommand(userId, petId, medicalRecordId, request));
            return Ok(BaseResponse<PetMedicalRecordResponse>.Ok(result, "Cập nhật hồ sơ y tế thành công."));
        }

        /// <summary>
        /// Xóa hồ sơ y tế.
        /// </summary>
        [HttpDelete("{petId:guid}/medical-records/{medicalRecordId:guid}")]
        public async Task<IActionResult> DeletePetMedicalRecord(Guid petId, Guid medicalRecordId)
        {
            var userId = GetCurrentUserId();
            await Mediator.Send(new DeletePetMedicalRecordCommand(userId, petId, medicalRecordId));
            return Ok(BaseResponse<object>.Ok(null, "Xóa hồ sơ y tế thành công."));
        }

        // ==================== User Access ====================

        /// <summary>
        /// Lấy danh sách người được chia sẻ quyền truy cập thú cưng.
        /// </summary>
        [HttpGet("{petId:guid}/access")]
        public async Task<IActionResult> GetPetAccessList(Guid petId)
        {
            var userId = GetCurrentUserId();
            var result = await Mediator.Send(new GetPetAccessListQuery(userId, petId));
            return Ok(BaseResponse<List<PetUserAccessResponse>>.Ok(result));
        }

        /// <summary>
        /// Chia sẻ quyền truy cập thú cưng cho người khác.
        /// </summary>
        [HttpPost("{petId:guid}/access")]
        public async Task<IActionResult> GrantPetAccess(Guid petId, [FromBody] GrantPetAccessRequest request)
        {
            var userId = GetCurrentUserId();
            var result = await Mediator.Send(new GrantPetAccessCommand(userId, petId, request));
            return Ok(BaseResponse<PetUserAccessResponse>.Ok(result, "Chia sẻ quyền truy cập thành công."));
        }

        /// <summary>
        /// Cập nhật quyền truy cập của người được chia sẻ.
        /// </summary>
        [HttpPut("{petId:guid}/access/{accessId:guid}")]
        public async Task<IActionResult> UpdatePetAccess(Guid petId, Guid accessId, [FromBody] UpdatePetAccessRequest request)
        {
            var userId = GetCurrentUserId();
            var result = await Mediator.Send(new UpdatePetAccessCommand(userId, petId, accessId, request));
            return Ok(BaseResponse<PetUserAccessResponse>.Ok(result, "Cập nhật quyền truy cập thành công."));
        }

        /// <summary>
        /// Thu hồi quyền truy cập của người được chia sẻ.
        /// </summary>
        [HttpDelete("{petId:guid}/access/{accessId:guid}")]
        public async Task<IActionResult> RevokePetAccess(Guid petId, Guid accessId)
        {
            var userId = GetCurrentUserId();
            await Mediator.Send(new RevokePetAccessCommand(userId, petId, accessId));
            return Ok(BaseResponse<object>.Ok(null, "Thu hồi quyền truy cập thành công."));
        }

        private Guid GetCurrentUserId()
        {
            return Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        }
    }
}
