using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.Order.Command;
using PetOmiPlatform.Application.Features.Order.DTOs.Request;
using PetOmiPlatform.Application.Features.Order.DTOs.Response;
using PetOmiPlatform.Application.Features.Order.Query;

namespace PetOmiPlatform.API.Controllers
{
    /// <summary>
    /// API đơn bán hàng tại quầy: tạo order không cần appointment, xem, xác nhận và hủy.
    /// </summary>
    [Route("api/orders")]
    [ApiController]
    [Authorize]
    public class OrderController : BaseController
    {
        public OrderController(IMediator mediator) : base(mediator) { }

        /// <summary>Tạo đơn bán hàng từ các mặt hàng trong kho clinic.</summary>
        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
        {
            var command = new CreateOrderCommand(CurrentUserId, request);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<OrderResponse>.Ok(result, "Tạo đơn hàng thành công."));
        }

        /// <summary>Lấy chi tiết order kèm danh sách mặt hàng.</summary>
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetOrder(Guid id, [FromQuery] Guid clinicId)
        {
            var query = new GetOrderByIdQuery(clinicId, CurrentUserId, id);
            var result = await Mediator.Send(query);
            return result != null
                ? Ok(BaseResponse<OrderResponse>.Ok(result))
                : NotFound(BaseResponse<OrderResponse?>.Fail("Không tìm thấy đơn hàng.", 404));
        }

        /// <summary>Xác nhận order draft trước khi tạo hóa đơn.</summary>
        [HttpPost("{id:guid}/confirm")]
        public async Task<IActionResult> ConfirmOrder(Guid id, [FromQuery] Guid clinicId)
        {
            var command = new ConfirmOrderCommand(clinicId, CurrentUserId, id);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<OrderResponse>.Ok(result, "Xác nhận đơn hàng thành công."));
        }

        /// <summary>Hủy order chưa thanh toán.</summary>
        [HttpPost("{id:guid}/cancel")]
        public async Task<IActionResult> CancelOrder(Guid id, [FromQuery] Guid clinicId)
        {
            var command = new CancelOrderCommand(clinicId, CurrentUserId, id);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<bool>.Ok(result, "Hủy đơn hàng thành công."));
        }
    }
}
