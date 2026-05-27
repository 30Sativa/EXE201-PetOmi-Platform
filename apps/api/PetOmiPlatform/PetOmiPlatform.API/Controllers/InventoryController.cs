using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.Clinic.Command;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Request;
using PetOmiPlatform.Application.Features.Clinic.DTOs.Response;
using System.Security.Claims;

namespace PetOmiPlatform.API.Controllers
{
    /// <summary>
    /// Quản lý kho thuốc / vật tư của phòng khám (scope MVP).
    /// Chỉ ClinicOwner mới có quyền thao tác.
    /// </summary>
    [Route("api/clinic/{clinicId:guid}/inventory")]
    [ApiController]
    [Authorize]
    public class InventoryController : BaseController
    {
        public InventoryController(IMediator mediator) : base(mediator) { }

        /// <summary>Lấy toàn bộ danh sách kho thuốc đang hoạt động.</summary>
        [HttpGet]
        public async Task<IActionResult> GetInventory(Guid clinicId)
        {
            var result = await Mediator.Send(new GetInventoryQuery(CurrentUserId, clinicId));
            return Ok(BaseResponse<IEnumerable<InventoryItemResponse>>.Ok(result));
        }

        /// <summary>Lấy danh sách thuốc/vật tư sắp hết tồn kho (Quantity ≤ LowStockThreshold).</summary>
        [HttpGet("low-stock")]
        public async Task<IActionResult> GetLowStock(Guid clinicId)
        {
            var result = await Mediator.Send(new GetLowStockQuery(CurrentUserId, clinicId));
            return Ok(BaseResponse<IEnumerable<InventoryItemResponse>>.Ok(result));
        }

        /// <summary>Thêm mặt hàng mới vào kho.</summary>
        [HttpPost]
        public async Task<IActionResult> AddItem(Guid clinicId, [FromBody] AddInventoryItemRequest request)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await Mediator.Send(new AddInventoryItemCommand(userId, clinicId, request));
            return Ok(BaseResponse<InventoryItemResponse>.Ok(result, "Thêm mặt hàng thành công."));
        }

        /// <summary>Nhập thêm hàng vào kho (Stock In).</summary>
        [HttpPost("{itemId:guid}/stock-in")]
        public async Task<IActionResult> StockIn(
            Guid clinicId, Guid itemId, [FromBody] StockAdjustRequest request)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await Mediator.Send(new StockInCommand(userId, clinicId, itemId, request));
            return Ok(BaseResponse<InventoryItemResponse>.Ok(result, $"Đã nhập {request.Amount} vào kho."));
        }

        /// <summary>Xuất hàng khỏi kho (Stock Out) — kê đơn thủ công.</summary>
        [HttpPost("{itemId:guid}/stock-out")]
        public async Task<IActionResult> StockOut(
            Guid clinicId, Guid itemId, [FromBody] StockAdjustRequest request)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await Mediator.Send(new StockOutCommand(userId, clinicId, itemId, request));
            return Ok(BaseResponse<InventoryItemResponse>.Ok(result, $"Đã xuất {request.Amount} khỏi kho."));
        }

        /// <summary>Xóa (soft-delete) mặt hàng khỏi kho — IsActive = false.</summary>
        [HttpDelete("{itemId:guid}")]
        public async Task<IActionResult> DeleteItem(Guid clinicId, Guid itemId)
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            await Mediator.Send(new DeleteInventoryItemCommand(userId, clinicId, itemId));
            return Ok(BaseResponse<object>.Ok(null, "Đã xóa mặt hàng."));
        }
    }
}
