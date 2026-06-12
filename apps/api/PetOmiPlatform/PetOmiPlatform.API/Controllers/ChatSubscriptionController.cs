using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.ChatSubscription.Commands;
using PetOmiPlatform.Application.Features.ChatSubscription.DTOs;
using PetOmiPlatform.Application.Features.ChatSubscription.Queries;

namespace PetOmiPlatform.API.Controllers;

/// <summary>
/// API subscription cho PetOmi AI chat cua owner.
/// </summary>
[Route("api/chat/subscription")]
[ApiController]
[Authorize]
public class ChatSubscriptionController : BaseController
{
    public ChatSubscriptionController(IMediator mediator) : base(mediator)
    {
    }

    /// <summary>Lay goi hien tai, quota va danh sach subscription theo pet cua owner.</summary>
    [HttpGet("status")]
    public async Task<IActionResult> GetStatus([FromQuery] Guid? petId)
    {
        var result = await Mediator.Send(new GetChatSubscriptionStatusQuery(CurrentUserId, petId));
        return Ok(BaseResponse<ChatSubscriptionStatusResponse>.Ok(result));
    }

    /// <summary>Tao QR SePay de mua/renew Premium cho mot pet.</summary>
    [HttpPost("payments")]
    public async Task<IActionResult> CreatePayment([FromBody] CreateChatSubscriptionPaymentRequest request)
    {
        var result = await Mediator.Send(new CreateChatSubscriptionPaymentCommand(CurrentUserId, request));
        return Ok(BaseResponse<ChatSubscriptionPaymentResponse>.Ok(result, "Da tao yeu cau thanh toan subscription."));
    }

    /// <summary>Kiem tra trang thai thanh toan subscription.</summary>
    [HttpGet("payments/{paymentId:guid}")]
    public async Task<IActionResult> GetPaymentStatus(Guid paymentId)
    {
        var result = await Mediator.Send(new GetChatSubscriptionPaymentStatusQuery(CurrentUserId, paymentId));
        return Ok(BaseResponse<ChatSubscriptionPaymentResponse>.Ok(result));
    }
}
