using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetOmiPlatform.API.Common;
using PetOmiPlatform.Application.Common.Models;
using PetOmiPlatform.Application.Features.Chat.Command;
using PetOmiPlatform.Application.Features.Chat.DTOs.Request;
using PetOmiPlatform.Application.Features.Chat.DTOs.Response;
using PetOmiPlatform.Application.Features.Chat.Query;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.API.Controllers;

[Route("api/chat")]
[ApiController]
[Authorize]
public class ChatController : BaseController
{
    public ChatController(IMediator mediator) : base(mediator)
    {
    }

    [HttpPost("messages")]
    public async Task<IActionResult> SendMessage([FromBody] SendChatMessageRequest request, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(new SendChatMessageCommand(CurrentUserId, request), cancellationToken);
        return Ok(BaseResponse<SendChatMessageResponse>.Ok(result));
    }

    [HttpPost("messages/{messageId:guid}/cancel")]
    public async Task<IActionResult> CancelMessage(Guid messageId)
    {
        var result = await Mediator.Send(new CancelChatMessageCommand(CurrentUserId, messageId));
        return Ok(BaseResponse<bool>.Ok(result));
    }

    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversations([FromQuery] int take = 50)
    {
        var result = await Mediator.Send(new GetUserConversationsQuery(CurrentUserId, take));
        return Ok(BaseResponse<List<ChatConversationResponse>>.Ok(result));
    }

    [HttpGet("conversations/{conversationId:guid}/messages")]
    public async Task<IActionResult> GetMessages(Guid conversationId, [FromQuery] int skip = 0, [FromQuery] int take = 50)
    {
        var result = await Mediator.Send(new GetConversationMessagesQuery(CurrentUserId, conversationId, skip, take));
        return Ok(BaseResponse<List<ChatMessageResponse>>.Ok(result));
    }
}
