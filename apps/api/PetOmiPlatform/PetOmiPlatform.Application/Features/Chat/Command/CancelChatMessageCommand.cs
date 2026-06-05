using MediatR;
using System;

namespace PetOmiPlatform.Application.Features.Chat.Command;

public record CancelChatMessageCommand(
    Guid UserId,
    Guid MessageId) : IRequest<bool>;
