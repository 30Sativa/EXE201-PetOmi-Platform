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
    [Authorize]  // Tất cả endpoint đều cần đăng nhập
    public class PetController : BaseController
    {
        public PetController(IMediator mediator) : base(mediator) { }

        /// <summary>
        /// Lấy danh sách tất cả thú cưng của chủ nuôi đang đăng nhập.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetMyPets()
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await Mediator.Send(new GetMyPetsQuery(userId));
            return Ok(BaseResponse<List<PetResponse>>.Ok(result));
        }

        /// <summary>
        /// Lấy thông tin chi tiết 1 thú cưng theo ID. Chỉ chủ nuôi mới xem được.
        /// </summary>
        [HttpGet("{petId:guid}")]
        public async Task<IActionResult> GetPetById(Guid petId)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
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
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await Mediator.Send(new CreatePetCommand(userId, request));
            return Ok(BaseResponse<PetResponse>.Ok(result, "Tạo hồ sơ thú cưng thành công."));
        }

        /// <summary>
        /// Cập nhật thông tin thú cưng. Chỉ chủ nuôi mới được cập nhật.
        /// </summary>
        [HttpPut("{petId:guid}")]
        public async Task<IActionResult> UpdatePet(Guid petId, [FromBody] UpdatePetRequest request)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await Mediator.Send(new UpdatePetCommand(userId, petId, request));
            return Ok(BaseResponse<PetResponse>.Ok(result, "Cập nhật thông tin thú cưng thành công."));
        }

        /// <summary>
        /// Xóa mềm hồ sơ thú cưng — dữ liệu vẫn được giữ trong DB, chỉ đánh dấu IsActive = false.
        /// </summary>
        [HttpDelete("{petId:guid}")]
        public async Task<IActionResult> DeletePet(Guid petId)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await Mediator.Send(new DeletePetCommand(userId, petId));
            return Ok(BaseResponse<object>.Ok(null, "Xóa hồ sơ thú cưng thành công."));
        }
    }
}
