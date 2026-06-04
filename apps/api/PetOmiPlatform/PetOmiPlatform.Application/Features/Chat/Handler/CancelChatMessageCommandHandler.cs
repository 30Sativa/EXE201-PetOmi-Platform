using MediatR;
using PetOmiPlatform.Application.Features.Chat.Command;
using PetOmiPlatform.Application.Interfaces;
using PetOmiPlatform.Domain.Common.Enums;
using PetOmiPlatform.Domain.Interfaces.Repositories;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Application.Features.Chat.Handler;

public class CancelChatMessageCommandHandler : IRequestHandler<CancelChatMessageCommand, bool>
{
    private readonly IChatMessageRepository _chatMessageRepository;
    private readonly IConversationRepository _conversationRepository;
    private readonly IAiTaskQueue _aiTaskQueue;
    private readonly IUnitOfWork _unitOfWork;

    public CancelChatMessageCommandHandler(
        IChatMessageRepository chatMessageRepository,
        IConversationRepository conversationRepository,
        IAiTaskQueue aiTaskQueue,
        IUnitOfWork unitOfWork)
    {
        _chatMessageRepository = chatMessageRepository;
        _conversationRepository = conversationRepository;
        _aiTaskQueue = aiTaskQueue;
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(CancelChatMessageCommand command, CancellationToken ct)
    {
        var message = await _chatMessageRepository.GetByIdAsync(command.MessageId)
            ?? throw new InvalidOperationException("Message not found.");

        var conversation = await _conversationRepository.GetByIdAsync(message.ConversationId)
            ?? throw new InvalidOperationException("Conversation not found.");

        if (conversation.UserId != command.UserId)
            throw new UnauthorizedAccessException("You do not have access to this message.");

        if (message.SenderRole != SenderRole.User)
            throw new InvalidOperationException("Only user messages can be cancelled.");

        if (message.Status is MessageStatus.Completed or MessageStatus.Failed or MessageStatus.Cancelled)
            return false;

        _aiTaskQueue.Cancel(message.Id);
        message.MarkCancelled();
        await _chatMessageRepository.UpdateAsync(message);
        await _unitOfWork.SaveChangesAsync(ct);

        return true;
    }
}
