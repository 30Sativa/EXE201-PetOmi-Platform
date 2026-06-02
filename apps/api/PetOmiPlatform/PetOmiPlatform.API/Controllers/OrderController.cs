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
    /// API don ban hang tai quay: tao order khong can appointment, xem, xac nhan, huy.
    /// </summary>
    [Route("api/orders")]
    [ApiController]
    [Authorize]
    public class OrderController : BaseController
    {
        public OrderController(IMediator mediator) : base(mediator) { }

        /// <summary>Tao don ban hang tu cac mat hang trong kho clinic.</summary>
        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
        {
            var command = new CreateOrderCommand(CurrentUserId, request);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<OrderResponse>.Ok(result, "Tao don hang thanh cong."));
        }

        /// <summary>Lay chi tiet order kem danh sach mat hang.</summary>
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetOrder(Guid id, [FromQuery] Guid clinicId)
        {
            var query = new GetOrderByIdQuery(clinicId, CurrentUserId, id);
            var result = await Mediator.Send(query);
            return result != null
                ? Ok(BaseResponse<OrderResponse>.Ok(result))
                : NotFound(BaseResponse<OrderResponse?>.Fail("Khong tim thay don hang.", 404));
        }

        /// <summary>Xac nhan order draft truoc khi tao hoa don.</summary>
        [HttpPost("{id:guid}/confirm")]
        public async Task<IActionResult> ConfirmOrder(Guid id, [FromQuery] Guid clinicId)
        {
            var command = new ConfirmOrderCommand(clinicId, CurrentUserId, id);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<OrderResponse>.Ok(result, "Xac nhan don hang thanh cong."));
        }

        /// <summary>Huy order chua thanh toan.</summary>
        [HttpPost("{id:guid}/cancel")]
        public async Task<IActionResult> CancelOrder(Guid id, [FromQuery] Guid clinicId)
        {
            var command = new CancelOrderCommand(clinicId, CurrentUserId, id);
            var result = await Mediator.Send(command);
            return Ok(BaseResponse<bool>.Ok(result, "Huy don hang thanh cong."));
        }
    }
}
