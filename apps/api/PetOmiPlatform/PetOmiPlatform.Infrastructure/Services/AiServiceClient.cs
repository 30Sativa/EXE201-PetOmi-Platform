using Microsoft.Extensions.Logging;
using PetOmiPlatform.Application.Interfaces;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace PetOmiPlatform.Infrastructure.Services;

public class AiServiceClient : IAiServiceClient
{
    private readonly IAiTaskQueue _taskQueue;
    private readonly ILogger<AiServiceClient> _logger;

    public AiServiceClient(IAiTaskQueue taskQueue, ILogger<AiServiceClient> logger)
    {
        _taskQueue = taskQueue;
        _logger = logger;
    }

    public async Task EnqueueChatAsync(
        Guid messageId,
        Guid conversationId,
        Guid userId,
        string content,
        Guid? petId,
        CancellationToken cancellationToken = default)
    {
        var task = new AiProcessTask(
            MessageId: messageId,
            ConversationId: conversationId,
            UserId: userId,
            Content: content,
            PetId: petId,
            CancellationToken: cancellationToken);

        await _taskQueue.EnqueueAsync(task, cancellationToken);
        _logger.LogInformation("Message {MessageId} queued for AI processing.", messageId);
    }
}
