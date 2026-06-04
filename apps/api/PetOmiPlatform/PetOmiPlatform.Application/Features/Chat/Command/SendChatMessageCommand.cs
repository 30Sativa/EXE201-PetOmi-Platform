using MediatR;
using PetOmiPlatform.Application.Features.Chat.DTOs.Request;
using PetOmiPlatform.Application.Features.Chat.DTOs.Response;
using System;

namespace PetOmiPlatform.Application.Features.Chat.Command
{
    public record SendChatMessageCommand(
        Guid UserId,
        SendChatMessageRequest Request) : IRequest<SendChatMessageResponse>;
}
